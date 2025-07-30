import { PGlite, Transaction } from "@electric-sql/pglite/dist/index.cjs";
import { components as OPENAPI } from "@db/models";

type Pack = OPENAPI["schemas"]["Pack"];
type Content = OPENAPI["schemas"]["Content"];
type BibleView = OPENAPI["schemas"]["BibleView"];
type BibleChapterView = OPENAPI["schemas"]["BibleChapterView"];
type BibleBooksPagedView = OPENAPI["schemas"]["BibleBooksPagedView"];
type BibleChaptersPagedView = OPENAPI["schemas"]["BibleChaptersPagedView"];
type PackView = OPENAPI["schemas"]["PackView"];
type HymnView = OPENAPI["schemas"]["HymnView"];
type ContentSlidesView = OPENAPI["schemas"]["ContentSlidesView"];

export async function get_all_packs(db: PGlite) {
  const res = await db.query(`
    SELECT * from "pack";
  `);
  return res.rows as Pack[];
}

export async function get_all_bibles(db: PGlite) {
  const res = await db.query(`
    SELECT bible from "view_bible_json";
  `);
  const views = res.rows as { bible: BibleView }[];
  return views.map((v) => v.bible);
}

export async function get_bible_chapter(db: PGlite, id: string) {
  const res = await db.query(
    `
    SELECT bible_chapter from "view_bible_chapter_json" where id = $1;
  `,
    [id],
  );
  const view = res.rows[0] as { bible_chapter: BibleChapterView };
  return view.bible_chapter;
}

export async function get_content_using_id(
  db: PGlite | Transaction,
  id: string,
) {
  const results = await db.query("SELECT * FROM content WHERE id=$1;", [id]);
  if (results.rows.length == 0) {
    return undefined;
  }
  return results.rows[0] as Content;
}

export async function get_hymn_using_id(db: PGlite | Transaction, id: string) {
  const results = await db.query(
    "SELECT hymn FROM view_hymn_json WHERE hymn_id=$1;",
    [id],
  );
  if (results.rows.length == 0) {
    return undefined;
  }
  return (results.rows[0] as { hymn: HymnView }).hymn;
}

export async function get_hymns_using_ids(db: PGlite, ids: string[]) {
  const all_promises = ids.map(
    async (id) =>
      await db.query(
        `
      SELECT hymn from view_hymn_json WHERE hymn_id = $1 
      `,
        [id],
      ),
  );

  const results = await Promise.all(all_promises);
  const hymns = results.map((r) => (r.rows[0] as { hymn: HymnView }).hymn);
  return hymns;
}

export async function get_pack_using_id_paged(
  db: PGlite | Transaction,
  id: string,
  page: number = 1,
  page_size: number = 20,
) {
  const result = await db.query(`
    SELECT get_pack_json_paged_ultra_fast('${id}', ${page}, ${page_size});
  `);

  if (result.rows.length == 0) {
    return undefined;
  }
  return (result.rows[0] as { get_pack_json_paged_ultra_fast: PackView })
    .get_pack_json_paged_ultra_fast;
}

export async function get_bible_books_paged(
  db: PGlite | Transaction,
  bible_id: string,
  page: number = 1,
  page_size: number = 20,
) {
  const result = await db.query(`
    SELECT get_bible_books_paged('${bible_id}', ${page}, ${page_size});
  `);

  if (result.rows.length == 0) {
    return undefined;
  }
  return (result.rows[0] as { get_bible_books_paged: BibleBooksPagedView })
    .get_bible_books_paged;
}

export async function get_bible_chapters_paged(
  db: PGlite | Transaction,
  book_id: string,
  page: number = 1,
  page_size: number = 20,
) {
  const result = await db.query(`
    SELECT get_bible_chapters_paged('${book_id}', ${page}, ${page_size});
  `);

  if (result.rows.length == 0) {
    return undefined;
  }
  return (
    result.rows[0] as { get_bible_chapters_paged: BibleChaptersPagedView }
  ).get_bible_chapters_paged;
}

export async function get_content_slides(
  db: PGlite | Transaction,
  content_id: string,
) {
  const result = await db.query(`
    SELECT get_content_slides('${content_id}');
  `);

  if (result.rows.length == 0) {
    return undefined;
  }
  return (result.rows[0] as { get_content_slides: ContentSlidesView })
    .get_content_slides;
}
