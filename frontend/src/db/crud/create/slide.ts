import { ContentType, BlockType } from "@/db/models";
import { uuidv7 } from "uuidv7";

interface Queryable {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: T[] }>;
}

/**
 * Inserts one empty slide (1 row, 1 column, 1 empty paragraph block) for a content item.
 * Uses the first language from the DB alphabetically.
 * Must be called inside an existing transaction (pass tx) or directly on db.
 */
export async function insertInitialSlide(tx: Queryable, contentId: string, contentType: ContentType): Promise<void> {
  const langResult = await tx.query<{ id: string }>("SELECT id FROM language ORDER BY name LIMIT 1");
  if (langResult.rows.length === 0) return;
  const languageId = langResult.rows[0].id;

  const slideId = uuidv7();
  const rowId = uuidv7();
  const colId = uuidv7();
  const blockId = uuidv7();

  await tx.query("INSERT INTO slide (id, content_id, position) VALUES ($1, $2, $3)", [slideId, contentId, 1]);
  await tx.query("INSERT INTO slide_row (id, slide_id, position, columns) VALUES ($1, $2, $3, $4)", [rowId, slideId, 1, 1]);
  await tx.query("INSERT INTO slide_column (id, row_id, position, language_id) VALUES ($1, $2, $3, $4)", [colId, rowId, 1, languageId]);
  await tx.query(
    "INSERT INTO slide_block (id, column_id, content_type, position, content, metadata) VALUES ($1, $2, $3, $4, $5, $6)",
    [blockId, colId, contentType, 1, "", JSON.stringify({ type: BlockType.paragraph })]
  );
}
