import type { PGliteWithLive } from "@electric-sql/pglite/live";
import type { components } from "@/db/models";

type BookView = components["schemas"]["BookView"];
type BookChapter = NonNullable<BookView["chapters"]>[number];

/**
 * Deletes an entire book, its chapters, and all their sections.
 * Explicit cascade is required because chapter/section rows live in `content`
 * and are linked via separate FK chains that PGlite's ON DELETE CASCADE handles
 * one level at a time — we delete leaf sections first, then chapters, then the book.
 */
export async function deleteBook(
  db: PGliteWithLive,
  bookId: string,
  chapters: BookView["chapters"]
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const chapter of chapters) {
      const sectionIds = chapter.sections.map((s) => s.section_id);
      if (sectionIds.length > 0) {
        await tx.query("DELETE FROM content WHERE id = ANY($1)", [sectionIds]);
      }
    }
    const chapterIds = chapters.map((c) => c.chapter_id);
    if (chapterIds.length > 0) {
      await tx.query("DELETE FROM content WHERE id = ANY($1)", [chapterIds]);
    }
    await tx.query("DELETE FROM content WHERE id=$1", [bookId]);
  });
}

/**
 * Deletes a book chapter and all its sections.
 */
export async function deleteBookChapter(
  db: PGliteWithLive,
  chapter: Pick<BookChapter, "chapter_id" | "sections">
): Promise<void> {
  await db.transaction(async (tx) => {
    const sectionIds = chapter.sections.map((s) => s.section_id);
    if (sectionIds.length > 0) {
      await tx.query("DELETE FROM content WHERE id = ANY($1)", [sectionIds]);
    }
    await tx.query("DELETE FROM content WHERE id=$1", [chapter.chapter_id]);
  });
}

/** Deletes a book section. ON DELETE CASCADE removes the section row automatically. */
export async function deleteBookSection(db: PGliteWithLive, sectionId: string): Promise<void> {
  await db.query("DELETE FROM content WHERE id=$1", [sectionId]);
}
