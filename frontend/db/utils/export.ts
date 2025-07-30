import { PGlite } from "@electric-sql/pglite/dist/index.cjs";
import JSZip from "jszip";

interface BlobsExportMap {
  content?: Blob;
  hymn?: Blob;
  liturgy?: Blob;
  liturgy_block?: Blob;
  bible_translation?: Blob;
  bible?: Blob;
  bible_chapter?: Blob;
  bible_book?: Blob;
  slide?: Blob;
  slide_column?: Blob;
  tags?: Blob;
  pack?: Blob;
  pack_item?: Blob;
}

/// COPY doesn't allow parameters
/// Direct string replacement is used here
/// DANGER: SQL Injection
export async function export_hymn(
  db: PGlite,
  hymn_id: string,
): Promise<BlobsExportMap> {
  const content_blob = (
    await db.query(
      `COPY (SELECT * FROM content WHERE id='${hymn_id}') TO '/dev/blob' WITH (FORMAT CSV, HEADER);`,
    )
  ).blob;
  const hymn_blob = (
    await db.query(
      `COPY (SELECT * FROM hymn WHERE id='${hymn_id}') TO '/dev/blob' WITH (FORMAT CSV, HEADER);`,
    )
  ).blob;
  const slides_ids = (
    await db.query(`SELECT id FROM slide WHERE content_id='${hymn_id}';`)
  ).rows.map((r: { id: string }) => r.id);

  const slides_blob = (
    await db.query(
      `COPY (SELECT * FROM slide WHERE content_id='${hymn_id}') TO '/dev/blob' WITH (FORMAT CSV, HEADER);`,
    )
  ).blob;

  const quotedIds = slides_ids.map((id) => `'${id}'::uuid`).join(", ");
  const slide_columns_blob = (
    await db.query(
      `COPY (SELECT * FROM slide_column WHERE slide_id=ANY(ARRAY[${quotedIds}])) TO '/dev/blob' WITH (FORMAT CSV, HEADER);`,
    )
  ).blob;

  return {
    content: content_blob,
    hymn: hymn_blob,
    slide: slides_blob,
    slide_column: slide_columns_blob,
  };
}

export async function export_pack(
  db: PGlite,
  pack_id: string,
): Promise<BlobsExportMap> {
  const pack_blob = (
    await db.query(
      `COPY (SELECT * FROM pack WHERE id='${pack_id}') TO '/dev/blob' WITH (FORMAT CSV, HEADER)`,
    )
  ).blob;

  const pack_content_ids = (
    await db.query(
      `SELECT content_id FROM pack_item WHERE pack_id='${pack_id}'`,
    )
  ).rows.map((r: { content_id: string }) => r.content_id);

  const pack_items_blob = (
    await db.query(
      `COPY (SELECT * FROM pack_item WHERE pack_id='${pack_id}') TO '/dev/blob' WITH (FORMAT CSV, HEADER)`,
    )
  ).blob;

  const contentQuotedIds = pack_content_ids
    .map((id) => `'${id}'::uuid`)
    .join(", ");
  const content_blob = (
    await db.query(
      `COPY (SELECT * FROM content WHERE id=ANY(ARRAY[${contentQuotedIds}])) TO '/dev/blob' WITH (FORMAT CSV, HEADER)`,
    )
  ).blob;

  const hymn_blob = (
    await db.query(
      `COPY (SELECT * FROM hymn WHERE id=ANY(ARRAY[${contentQuotedIds}])) TO '/dev/blob' WITH (FORMAT CSV, HEADER)`,
    )
  ).blob;

  const bible_books_ids = (
    await db.query(
      `SELECT bible_book_id FROM bible_chapter WHERE id=ANY(ARRAY[${contentQuotedIds}])`,
    )
  ).rows.map((r: { bible_book_id: string }) => r.bible_book_id);

  const bibleBooksQuotedIds = bible_books_ids
    .map((id) => `'${id}'::uuid`)
    .join(", ");

  const bible_chapter_blob = (
    await db.query(
      `COPY (SELECT * FROM bible_chapter WHERE id=ANY(ARRAY[${contentQuotedIds}])) TO '/dev/blob' WITH (FORMAT CSV, HEADER)`,
    )
  ).blob;

  const bible_books_blob = (
    await db.query(
      `COPY (SELECT * FROM bible_book WHERE id=ANY(ARRAY[${bibleBooksQuotedIds}])) TO '/dev/blob' WITH (FORMAT CSV, HEADER)`,
    )
  ).blob;

  const bible_ids = (
    await db.query(
      `SELECT bible_id FROM bible_book WHERE id=ANY(ARRAY[${bibleBooksQuotedIds}])`,
    )
  ).rows.map((r: { bible_id: string }) => r.bible_id);
  const bibleQuotedIds = bible_ids.map((id) => `'${id}'::uuid`).join(", ");
  const bible_blob = (
    await db.query(
      `COPY (SELECT * FROM bible WHERE id=ANY(ARRAY[${bibleQuotedIds}])) TO '/dev/blob' WITH (FORMAT CSV, HEADER)`,
    )
  ).blob;

  const bible_translation_ids = (
    await db.query(
      `SELECT translation_id FROM bible WHERE id=ANY(ARRAY[${bibleQuotedIds}])`,
    )
  ).rows.map((r: { translation_id: string }) => r.translation_id);
  const bibleTranslationQuotedIds = bible_translation_ids
    .map((id) => `'${id}'`)
    .join(", ");

  const bible_translation_blob = (
    await db.query(
      `COPY (SELECT * FROM bible_translation WHERE id=ANY(ARRAY[${bibleTranslationQuotedIds}])) TO '/dev/blob' WITH (FORMAT CSV, HEADER)`,
    )
  ).blob;

  const slides_blob = (
    await db.query(
      `COPY (SELECT * FROM slide WHERE content_id=ANY(ARRAY[${contentQuotedIds}])) TO '/dev/blob' WITH (FORMAT CSV, HEADER)`,
    )
  ).blob;

  const slides_ids = (
    await db.query(
      `SELECT id FROM slide WHERE content_id=ANY(ARRAY[${contentQuotedIds}])`,
    )
  ).rows.map((r: { id: string }) => r.id);

  const slidesQuotedIds = slides_ids.map((id) => `'${id}'::uuid`).join(", ");
  const slide_columns_blob = (
    await db.query(
      `COPY (SELECT * FROM slide_column WHERE slide_id=ANY(ARRAY[${slidesQuotedIds}])) TO '/dev/blob' WITH (FORMAT CSV, HEADER)`,
    )
  ).blob;

  return {
    content: content_blob,
    hymn: hymn_blob,
    slide: slides_blob,
    slide_column: slide_columns_blob,
    pack: pack_blob,
    pack_item: pack_items_blob,
    bible_translation: bible_translation_blob,
    bible: bible_blob,
    bible_book: bible_books_blob,
    bible_chapter: bible_chapter_blob,
  };
}

export const zipBlobsAndDownload = async (
  blobMap: BlobsExportMap,
  id: string,
) => {
  const zip = new JSZip();
  const order_str = `content.csv
tag.csv
tag_assignment.csv
pack.csv
pack_item.csv
hymn.csv
liturgy.csv
liturgy_block.csv
bible_translation.csv
bible.csv
bible_book.csv
bible_chapter.csv
slide.csv
slide_column.csv`;

  const content_blob = new Blob([order_str], { type: "text/plain" });
  zip.file("order", content_blob);
  // Add blobs to the zip with a filename
  Object.entries(blobMap).forEach(([name, blob]) => {
    zip.file(`${name}.csv`, blob);
  });

  // Generate the zip file as a Blob
  const zippedBlob = await zip.generateAsync({ type: "blob" });

  // Trigger download
  const url = URL.createObjectURL(zippedBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `export_${id}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url); // cleanup
};
