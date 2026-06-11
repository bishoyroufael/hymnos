import type { PGliteWithLive } from "@electric-sql/pglite/live";
import JSZip from "jszip";

/**
 * Export a single resource (hymn or book) and all of its related rows as a zip
 * of per-table CSV files, in the exact format `import_tables_from_zip` expects
 * (one `<table>.csv` per table, `FORMAT csv, HEADER`). This makes export/import
 * a symmetric round-trip.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TableQuery = { table: string; query: string };

/**
 * Run `COPY (query) TO '/dev/blob'` and return the resulting CSV blob.
 * NOTE: COPY's inner query cannot be parameterized, so callers must inline only
 * validated literals (we validate the resource id as a UUID before building).
 */
async function copyQueryToCsv(db: PGliteWithLive, query: string): Promise<Blob> {
  const ret = await db.query(`COPY (${query}) TO '/dev/blob' WITH (FORMAT csv, HEADER)`);
  if (!ret.blob) throw new Error("COPY TO did not return a blob");
  return ret.blob;
}

/** Slide subtree (slides -> rows -> columns -> blocks) + referenced languages for a content-id filter. */
function slideHierarchyQueries(contentFilter: string): TableQuery[] {
  const slideIds = `SELECT id FROM slide WHERE ${contentFilter}`;
  const rowIds = `SELECT id FROM slide_row WHERE slide_id IN (${slideIds})`;
  const colIds = `SELECT id FROM slide_column WHERE row_id IN (${rowIds})`;
  return [
    { table: "slide", query: `SELECT * FROM slide WHERE ${contentFilter}` },
    { table: "slide_row", query: `SELECT * FROM slide_row WHERE slide_id IN (${slideIds})` },
    { table: "slide_column", query: `SELECT * FROM slide_column WHERE row_id IN (${rowIds})` },
    { table: "slide_block", query: `SELECT * FROM slide_block WHERE column_id IN (${colIds})` },
    { table: "language", query: `SELECT * FROM language WHERE id IN (SELECT DISTINCT language_id FROM slide_column WHERE row_id IN (${rowIds}))` },
  ];
}

/** Tag assignments + the tags they reference, for a content-id filter. */
function tagQueries(contentIdFilter: string): TableQuery[] {
  return [
    { table: "tag_assignment", query: `SELECT * FROM tag_assignment WHERE ${contentIdFilter}` },
    { table: "tag", query: `SELECT * FROM tag WHERE id IN (SELECT tag_id FROM tag_assignment WHERE ${contentIdFilter})` },
  ];
}

function hymnQueries(id: string): TableQuery[] {
  const contentFilter = `content_id = '${id}'`;
  return [
    { table: "content", query: `SELECT * FROM content WHERE id = '${id}'` },
    { table: "hymn", query: `SELECT * FROM hymn WHERE id = '${id}'` },
    ...slideHierarchyQueries(contentFilter),
    ...tagQueries(contentFilter),
  ];
}

function bookQueries(id: string): TableQuery[] {
  const chapterIds = `SELECT chapter_id FROM book_chapter_link WHERE book_id = '${id}'`;
  // The book itself, all its chapters, and all their sections — every content row in the subtree.
  const allContentIds = `SELECT '${id}'::uuid AS id
    UNION SELECT chapter_id FROM book_chapter_link WHERE book_id = '${id}'
    UNION SELECT id FROM book_section WHERE chapter_id IN (${chapterIds})`;
  const contentFilter = `content_id IN (${allContentIds})`;
  return [
    { table: "content", query: `SELECT * FROM content WHERE id IN (${allContentIds})` },
    { table: "book", query: `SELECT * FROM book WHERE id = '${id}'` },
    { table: "book_chapter", query: `SELECT * FROM book_chapter WHERE id IN (${chapterIds})` },
    { table: "book_chapter_link", query: `SELECT * FROM book_chapter_link WHERE book_id = '${id}'` },
    { table: "book_section", query: `SELECT * FROM book_section WHERE chapter_id IN (${chapterIds})` },
    ...slideHierarchyQueries(contentFilter),
    ...tagQueries(contentFilter),
  ];
}

/**
 * Build a zip of CSV table exports for one resource.
 * @returns the zip blob and a suggested download filename.
 */
export async function exportResourceAsZip(db: PGliteWithLive, contentId: string): Promise<{ blob: Blob; filename: string }> {
  if (!UUID_RE.test(contentId)) throw new Error("Invalid resource id");

  const res = await db.query<{ type: string }>(`SELECT type FROM content WHERE id = $1`, [contentId]);
  const type = res.rows[0]?.type;
  if (!type) throw new Error("Resource not found");

  let tableQueries: TableQuery[];
  if (type === "hymn") tableQueries = hymnQueries(contentId);
  else if (type === "book") tableQueries = bookQueries(contentId);
  else throw new Error(`Export is not supported for content type "${type}"`);

  const zip = new JSZip();
  for (const { table, query } of tableQueries) {
    zip.file(`${table}.csv`, await copyQueryToCsv(db, query));
  }

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
  return { blob, filename: `${type}-${contentId}.zip` };
}

/** Trigger a browser download for a blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
