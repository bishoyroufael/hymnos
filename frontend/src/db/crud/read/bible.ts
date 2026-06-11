import type { components } from "@/db/models";
import type { PGliteWithLive } from "@electric-sql/pglite/live";

type BibleChapterView = components["schemas"]["BibleChapterView"];

/**
 * Get Bible chapter by ID
 */
export async function getBibleChapter(db: PGliteWithLive, id: string): Promise<BibleChapterView | undefined> {
  const res = await db.query(`SELECT bible_chapter FROM "view_bible_chapter_json" WHERE id = $1;`, [id]);
  if (res.rows.length === 0) {
    return undefined;
  }
  const view = res.rows[0] as { bible_chapter: BibleChapterView };
  return view.bible_chapter;
}
