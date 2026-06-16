import { ContentType, BlockType } from "@/db/models";
import type { components } from "@/db/models";
import { uuidv7 } from "uuidv7";

type SlideView = components["schemas"]["SlideView"];

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

/**
 * Inserts the given slides (rows/columns/blocks) for a content item, PRESERVING the ids
 * carried on each slide/row/column/block. Used by saveBookEdit when rewriting a book from
 * local state, so slide ids stay stable across saves. Must run inside a transaction.
 */
export async function insertSlidesWithIds(tx: Queryable, contentId: string, contentType: ContentType, slides: SlideView[]): Promise<void> {
  for (const slide of slides) {
    await tx.query("INSERT INTO slide (id, content_id, position) VALUES ($1, $2, $3)", [slide.slide_id, contentId, slide.position]);
    for (const row of slide.slide_rows) {
      await tx.query("INSERT INTO slide_row (id, slide_id, position, columns) VALUES ($1, $2, $3, $4)", [row.id, slide.slide_id, row.position, row.columns]);
      for (const col of row.slide_columns) {
        await tx.query("INSERT INTO slide_column (id, row_id, position, language_id) VALUES ($1, $2, $3, $4)", [col.id, row.id, col.position, col.language.id]);
        for (const block of col.blocks) {
          await tx.query(
            "INSERT INTO slide_block (id, column_id, content_type, position, content, metadata) VALUES ($1, $2, $3, $4, $5, $6)",
            [block.id, col.id, contentType, block.position, block.content, JSON.stringify(block.metadata ?? { type: BlockType.paragraph })]
          );
        }
      }
    }
  }
}
