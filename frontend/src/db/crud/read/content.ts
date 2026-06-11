import type { components } from "@/db/models";
import type { PGliteWithLive } from "@electric-sql/pglite/live";

type Content = components["schemas"]["Content"];

/**
 * Get content by ID
 */
export async function getContentById(db: PGliteWithLive, id: string): Promise<Content | undefined> {
  const results = await db.query("SELECT * FROM content WHERE id=$1;", [id]);
  if (results.rows.length === 0) {
    return undefined;
  }
  return results.rows[0] as Content;
}
