import { Dexie, PromiseExtended, type EntityTable } from 'dexie';
import { generateRandomString, normalize_text } from './utils';
import dexieObservable from 'dexie-observable';
import dexieSyncable from 'dexie-syncable';
import { Hymn, HymnsPack, Slide, Tag } from './models';


// Database declaration (move this to its own module also)
export const db = new Dexie('HymnsDatabase', {"addons":[dexieObservable, dexieSyncable]}) as Dexie & {
  hymns: EntityTable<Hymn, 'uuid'>;
  packs: EntityTable<HymnsPack, 'uuid'>;
  slides: EntityTable<Slide, 'uuid'>;
  tags: EntityTable<Tag, 'uuid'>;
};

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
  const prefixes = q.trim().split(" ").map(w=>normalize_text(w));
  try {
    const slides = await find_in_slides(prefixes);
    // const endTime = performance.now()
    // console.log(`took ${endTime - startTime} milliseconds`)
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

export function get_hymns_from_slides(slides: Slide[]) {
  return db.hymns.where(":id").anyOf( slides.map(v => v.hymn_uuid) ).toArray((h)=>{
    return h
  })
}

export function get_slides_of_hymn(hymn_uuid: string) {
  db.slides.count().then(c=>console.log(c));
  return db.transaction('r', [db.hymns, db.slides], async ()=>{
    const slides_order  = (await db.hymns.get(hymn_uuid)).slides_order;
    const slides: Slide[] = await db.slides.bulkGet(slides_order)
    return slides
  });
}

export async function is_db_empty() {
  // for now we check if there's hymns
  const n = await db.hymns.count();
  return n == 0;
}