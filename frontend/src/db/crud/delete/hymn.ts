import type { PGliteWithLive } from "@electric-sql/pglite/live";

/** Deletes a hymn. ON DELETE CASCADE removes the hymn row automatically. */
export async function deleteHymn(db: PGliteWithLive, id: string): Promise<void> {
  await db.query("DELETE FROM content WHERE id=$1", [id]);
}
