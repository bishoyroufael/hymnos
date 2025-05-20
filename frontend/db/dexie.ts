import { Dexie, PromiseExtended, type EntityTable } from 'dexie';
import { generateRandomString, normalize_text } from './utils';
import dexieObservable from 'dexie-observable';
import dexieSyncable from 'dexie-syncable';
import { Hymn, HymnsPack, Slide, Tag } from './models';
import { HymnosDataExport } from '@utils/exporter';

export const SIZE_PER_PAGE = 10;

// Database declaration (move this to its own module also)
export const db = new Dexie('HymnsDatabase', {"addons":[dexieObservable, dexieSyncable]}) as Dexie & {
  hymns: EntityTable<Hymn, 'uuid'>;
  packs: EntityTable<HymnsPack, 'uuid'>;
  slides: EntityTable<Slide, 'uuid'>;
  tags: EntityTable<Tag, 'uuid'>;
};

export const DEXIE_VERSION = Dexie.version

db.version(1).stores({
  hymns: '$$uuid',
  packs: '$$uuid',
  slides: '$$uuid, *lines, *linesWords',
  tags: '$$uuid',
});

db.slides.hook("creating", function(pk, obj, trans) {
  if(obj.lines.constructor.name == "Array") obj.linesWords = getAllWords(obj.lines.join(" "));
})

db.slides.hook("updating", function (mods, primKey, obj, trans) {
    if (mods.hasOwnProperty("lines")) {
        // "lines" property is being updated
        if ((mods as any).lines.constructor.name == 'Array')
            // "lines" property was updated to another valid value. Re-index messageWords:
            return { linesWords: getAllWords((mods as any).lines.join(" ")) };
        else
            // "lines" property was deleted (typeof mods.lines === 'undefined') or changed to an unknown type. Remove indexes:
            return { linesWords: [] };
    }
});


function getAllWords(text: string) {
    /// <param name="text" type="String"></param>
    var allWordsIncludingDups = text.split(' ').map(w=>normalize_text(w));
    var wordSet = allWordsIncludingDups.reduce(function (prev, current) {
        prev[current] = true;
        return prev;
    }, {});
    return Object.keys(wordSet);
}


function* chunkArray<T>(array: T[], chunkSize: number): IterableIterator<T[]> {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize);
  }
}

/**
 * Inserts hymns, packs, and slides into the database in chunks.
 * @param hymns - An array of Hymn objects to insert.
 * @param packs - An array of HymnsPack objects to insert.
 * @param slides - An array of Slide objects to insert.
 * @param chunkSize - The size of each chunk to insert at a time (default is 200).
 * @param onProgress - A callback function that receives the progress percentage as an argument.
 */
export async function insert_hymns_and_packs(
  hymns: Array<Hymn>,
  packs: Array<HymnsPack>,
  slides: Array<Slide>,
  chunkSize: number = 200,
  onProgress: (newProgress: number) => void
): Promise<void> {
  const totalItems = hymns.length + packs.length + slides.length;
  let completedItems = 0;

  try {
    // Helper function to process chunks and update progress
    const bulkPutChunks = async <T>(data: T[], store: EntityTable<any, any>) => {
      for (const chunk of chunkArray(data, chunkSize)) {
        await db.transaction('rw', store, async () => {
          await store.bulkPut(chunk);
        });
        completedItems += chunk.length;
        onProgress(Math.round(completedItems/totalItems*100));
      }
    };

    await bulkPutChunks(hymns, db.hymns);
    await bulkPutChunks(packs, db.packs);
    await bulkPutChunks(slides, db.slides);


    console.log("Added hymns, packs, and slides successfully!");
    onProgress(Math.round(completedItems/totalItems*100));
  } catch (e) {
    console.error("Error during bulk insertion:", e);
    onProgress(Math.round(completedItems/totalItems*100));
  }
}

// https://github.com/dexie/Dexie.js/issues/281#issuecomment-229228163
async function find_in_slides(prefixes: string[], l: number = 10) {
    return db.transaction('r', db.slides, function*() {
        // Parallell search for all prefixes - just select resulting primary keys
        const results = yield Dexie.Promise.all (prefixes.map(prefix =>
            db.slides
                .where('linesWords')
                .startsWith(prefix)
                .primaryKeys()));

        // Intersect result set of primary keys
        const reduced = results
           .reduce ((a: any[], b: Iterable<unknown>) => {
                const set = new Set(b);
                return a.filter(k => set.has(k));
            });
        // Finally select entire documents from intersection
        return yield db.slides.where(':id').anyOf (reduced).limit(l).toArray();
    });
}


export async function search_in_slides(q: string) {
  const startTime = performance.now()
  console.log("search working in progress");
  // Get prefixes and run search over word splits
  const prefixes = [...new Set(q.trim().split(" ").map(w=>normalize_text(w)))];
  console.log(prefixes);
  try {
    const slides = await find_in_slides(prefixes);
    const endTime = performance.now()
    console.log(`took ${endTime - startTime} milliseconds`)
    const slidesArr: Slide[] = [];
    // todo: how to convert this wierd generator to an array of slides
    for (const ss of slides) {
      slidesArr.push(ss as unknown as Slide);
    }
    return slidesArr;
  } catch (r) {
    console.log(r);
    return [];
  }
}

/**
 * Retrieves hymns from the database based on an array of slide objects.
 * @param slides - An array of Slide objects to retrieve hymns for.
 * @returns A Promise that resolves to an array of Hymn objects.
 */
export function get_hymns_from_slides(slides: Slide[]) {
  return db.hymns.where(":id").anyOf( slides.map(v => v.hymn_uuid) ).toArray((h)=>{
    return h
  })
}

/**
 * Retrieves the slides for a given hymn UUID from the database.
 * @param hymn_uuid - The UUID of the hymn to retrieve slides for.
 * @returns A Promise that resolves to an array of Slide objects.
 */
export function get_slides_of_hymn(hymn_uuid: string) {
  // db.slides.count().then(c=>console.log(c));
  return db.transaction('r', [db.hymns, db.slides], async ()=>{
    const slides_order  = (await db.hymns.get(hymn_uuid)).slides_order;
    const slides: Slide[] = await db.slides.bulkGet(slides_order)
    return slides
  });
}

/**
 * Checks if the database is empty by counting the number of hymns.
 * @returns A Promise that resolves to a boolean indicating whether the database is empty or not.
 */
export async function is_db_empty() {
  // for now we check if there's hymns
  const n = await db.hymns.count();
  return n == 0;
}


/**
 * Get all hymn packs in a database
 * @returns A Promise that resolves to an array containing all hymn packs.
 */
export async function get_all_packs() {
  const packs: HymnsPack[] = await db.packs.toArray();
  return packs;
}

/**
 * @param uuid string of uuids of hymns
 * @returns array of Hymns
 */
export async function get_hymns_by_uuid(uuid: string[]) {
  const hymns = await db.hymns.bulkGet(uuid)
  return hymns
}

/**
 * @param uuid string of uuids of hymn
 * @returns hymn if present
 */
export async function get_hymn_by_uuid(uuid: string) {
  const hymn = await db.hymns.get(uuid)
  return hymn
}

/**
 * 
 * @param uuid string of uuid of pack
 * @returns return pack if found
 */
export async function get_pack_by_uuid(uuid: string) {
  const pack = await db.packs.get(uuid);
  return pack
}


/**
 * 
 * @param pack_uuid uuid of pack
 * @param page the page number, page must be >= 1
 * @returns hymns of the page
 */
export async function get_pack_hymns_paged(pack_uuid: string, page: number = 1) {
  // page is assumed to contain 5 results
  const start_idx = (page - 1) * SIZE_PER_PAGE;
  const hymns_uuids = (await db.packs.get(pack_uuid)).hymns_uuid.slice(start_idx, start_idx + SIZE_PER_PAGE);
  const hymns = (await get_hymns_by_uuid(hymns_uuids)).toSorted((a,b)=>a.title.localeCompare(b.title));
  return hymns;
}


/**
 * 
 * @param updated_slides new slides of already existing hymn
 * @param hymn_uuid hymn uuid
 * @returns void
 */
export async function update_hymn_with_slides(hymn_uuid: string, updated_slides: Slide[]) {
  const hymn = await db.hymns.get(hymn_uuid);
  // 1. Find uuids of slides that user deleted while editing for hymn
  const new_slides_uuids = updated_slides.map((v)=>v.uuid);
  const deleted_slides = hymn.slides_order.filter(item => !new_slides_uuids.includes(item));
  if (deleted_slides.length > 0){
    db.slides.bulkDelete(deleted_slides);
  }

  // 2. Add or update new slides in table
  const _rs = await db.slides.bulkPut(updated_slides, {allKeys: true})
  
  // 3. Update hymn slide order
  hymn.slides_order = new_slides_uuids
  const _rh = await db.hymns.put(hymn)
}


/**
 * 
 * @param pack pack object to be inserted or updated
 */
export async function update_or_add_pack(pack: HymnsPack) {
  const _ = db.packs.put(pack)
}


/**
 * 
 * @param hymn hymn object to be inserted or updated
 */
export async function update_or_add_hymn(hymn: Hymn) {
  const _ = db.hymns.put(hymn)
}

/**
 * 
 * @param uuid uuid of hymn to be removed (i.e will also remove references to the hymn in packs and slides)
 */
export async function delete_hymn_by_uuid(uuid: string) {
  const rp = await db.packs.filter((p)=>p.hymns_uuid.includes(uuid)).toArray() // packs having the hymn
  const updatedPacks = rp.map(p => ({ ...p, hymns_uuid: p.hymns_uuid.filter(u => u !== uuid) }));
  const _fp = await db.packs.bulkPut(updatedPacks)
  const _rs = await db.slides.filter((s)=>s.hymn_uuid == uuid).delete()
  const _rh = db.hymns.delete(uuid);
}


/**
 * 
 * @param uuid uuid of pack to be deleted (doesn't delete hymns inside)
 */
export async function delete_pack_by_uuid(uuid: string) {
  const dp = await db.packs.delete(uuid)
}



/**
 * 
 * @param uuid uuid of hymn to export
 * @returns object containing hymn and slides of hymn
 */
export async function export_hymn(uuid: string) {
  const hymn = await get_hymn_by_uuid(uuid)
  const slides = await db.slides.bulkGet(hymn.slides_order)
  return {
    hymn: hymn,
    slides: slides
  }
}

/**
 * 
 * @param uuid uuid of pack to export
 * @returns object containing pack and its related hymns and slides
 */
export async function export_pack(uuid: string) { 
  const pack = await db.packs.get(uuid);
  const hymns = await db.hymns.bulkGet(pack.hymns_uuid);
  const slideGroups = await Promise.all(
      hymns.map(h => db.slides.bulkGet(h.slides_order))
  );
  const slides: Slide[] = slideGroups.flat();

  return {
    pack: pack,
    hymns: hymns,
    slides: slides
  }
}


/**
 * 
 * @param data data from an export to import to the database
 */
export async function import_data(data: HymnosDataExport) {
  const _hp = await db.packs.bulkPut(data.packs)
  const _hs = await db.slides.bulkPut(data.slides)
  const _hh = await db.hymns.bulkPut(data.hymns)
}