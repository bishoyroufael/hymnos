import { Dexie, type EntityTable } from 'dexie';
import { generateRandomString } from './utils';
import dexieObservable from 'dexie-observable';
import dexieSyncable from 'dexie-syncable';
import { Hymn, HymnsPack, Slide, Tag } from './models';


// Database declaration (move this to its own module also)
export const db = new Dexie('HymnsDatabase', {"addons":[dexieObservable, dexieSyncable]}) as Dexie & {
  hymns: EntityTable<Hymn>;
  packs: EntityTable<HymnsPack>;
  slides: EntityTable<Slide>;
  tags: EntityTable<Tag>;
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



// function trigrams(s: string) {
//   const n = 3;
//   var r = [];
//   for(var i = 0; i <= s.length - n; i++)
//      r.push(s.substring(i, i + n));
//   return r;
// }


function getAllWords(text: string) {
    /// <param name="text" type="String"></param>
    var allWordsIncludingDups = text.split(' ');
    var wordSet = allWordsIncludingDups.reduce(function (prev, current) {
        prev[current] = true;
        return prev;
    }, {});
    return Object.keys(wordSet);
}

// function generate_fake_data(N=100000)
// {
//     const result = [];
//     for (let i = 1; i <= N; i++) {
//         const t = generateRandomString(2500);
//         const obj : Hymn = {
//             // id: i, // Ensures uniqueness
//             text: t,
//             title: "dump hymn",
//             music_author: generateRandomString(2500),
//             words_author: generateRandomString(2500),
//             chords: generateRandomString(2500),
//             chords_pos: generateRandomString(2500),
//             tags: []
//         };
//         result.push(obj);
//     }
//     return result
// }

// export function bulk_insert_hymns() {
//   const fd1 = generate_fake_data(100); 
//   db.hymns.bulkPut(fd1).then((n)=>{console.log(n)},(r)=>{console.log(r)});
// }


export function insert_hymns_and_packs(hymns: Array<Hymn>, packs: Array<HymnsPack>, slides: Array<Slide>) {
  db.transaction('rw', [db.hymns, db.packs, db.slides], function () {
    db.hymns.bulkPut(hymns);
    db.packs.bulkPut(packs);
    db.slides.bulkPut(slides);
    console.log("Added hymns and packs!")
  }).catch(function(e) {
    console.log(e)
  })
}

// https://github.com/dexie/Dexie.js/issues/281#issuecomment-229228163
function find_in_slides(prefixes: string[], l: number = 10) {
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


export function search_text(q: string) {
  // const startTime = performance.now()

  // Get prefixes and run search over word splits
  const prefixes = q.trim().split(" ")
  find_in_slides(prefixes).then(slides => {
    // const endTime = performance.now()
    // console.log(`took ${endTime - startTime} milliseconds`)
    return slides
  }).catch((r)=>{
    console.log(r)
  })

}


