import { PGlite } from "@electric-sql/pglite/dist/index.cjs";
import JSZip from "jszip";

interface BlobsExportMap {
  content?: Blob;
  hymn?: Blob;
  liturgy?: Blob;
  liturgy_block?: Blob;
  bible?: Blob;
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
  };
}

export const zipBlobsAndDownload = async (
  blobMap: BlobsExportMap,
  id: string,
) => {
  const zip = new JSZip();

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
