import type { components } from "@/db/models";
import type { PGliteWithLive } from "@electric-sql/pglite/live";

type SlideView = components["schemas"]["SlideView"];
type ContentType = components["schemas"]["ContentType"];

/**
 * Upsert slide data into the database
 * This function handles inserting or updating slides, rows, columns, and blocks
 *
 * @param db - PGlite database instance
 * @param contentId - UUID of the content item (hymn, bible_chapter, etc.)
 * @param contentType - Type of content (for denormalization in slide_block)
 * @param slides - Array of slide views to upsert
 */
export async function upsertSlides(db: PGliteWithLive, contentId: string, contentType: ContentType, slides: SlideView[]): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // Delete existing slides for this content to avoid conflicts
      // ON DELETE CASCADE will handle deleting rows, columns, and blocks
      await tx.query(`DELETE FROM slide WHERE content_id = $1`, [contentId]);

      // Insert each slide with all its nested data
      for (const slide of slides) {
        // Insert slide
        await tx.query(
          `INSERT INTO slide (id, content_id, position)
           VALUES ($1, $2, $3)`,
          [slide.slide_id, contentId, slide.position]
        );

        // Insert slide rows
        for (const row of slide.slide_rows) {
          await tx.query(
            `INSERT INTO slide_row (id, slide_id, position, columns)
             VALUES ($1, $2, $3, $4)`,
            [row.id, slide.slide_id, row.position, row.columns]
          );

          // Insert slide columns
          for (const column of row.slide_columns) {
            await tx.query(
              `INSERT INTO slide_column (id, row_id, position, language_id)
               VALUES ($1, $2, $3, $4)`,
              [column.id, row.id, column.position, column.language.id]
            );

            // Insert slide blocks
            for (const block of column.blocks) {
              await tx.query(
                `INSERT INTO slide_block (id, column_id, content_type, position, content, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [block.id, column.id, contentType, block.position, block.content, JSON.stringify(block.metadata ?? { type: "paragraph" })]
              );
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Failed to upsert slides:", error);
    throw new Error(`Failed to save slide data: ${error}`);
  }
}
