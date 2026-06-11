import type { PGliteWithLive } from "@electric-sql/pglite/live";
import { ContentType } from "@/db/models";
import { uuidv7 } from "uuidv7";
import { insertInitialSlide } from "./slide";

export interface BookCreateInput {
  name: string;
  author?: string;
  description?: string;
  isbn?: string;
  chapters: {
    id: string;
    name: string;
    description?: string;
    sections: {
      id: string;
      name: string;
      description?: string;
      rubric?: string;
    }[];
  }[];
}

/** Creates a full book with chapters and sections in one transaction. Returns the new book ID. */
export async function createBook(db: PGliteWithLive, input: BookCreateInput): Promise<string> {
  const bookId = uuidv7();
  await db.transaction(async (tx) => {
    await tx.query("INSERT INTO content (id, type) VALUES ($1, $2)", [bookId, ContentType.book]);
    await tx.query(
      "INSERT INTO book (id, name, author, description, isbn) VALUES ($1, $2, $3, $4, $5)",
      [bookId, input.name, input.author ?? null, input.description ?? null, input.isbn ?? null]
    );
    for (const [idx, chapter] of input.chapters.entries()) {
      await tx.query("INSERT INTO content (id, type) VALUES ($1, $2)", [chapter.id, ContentType.book_chapter]);
      await tx.query(
        "INSERT INTO book_chapter (id, name, description) VALUES ($1, $2, $3)",
        [chapter.id, chapter.name, chapter.description ?? null]
      );
      await tx.query(
        "INSERT INTO book_chapter_link (book_id, chapter_id, position) VALUES ($1, $2, $3)",
        [bookId, chapter.id, idx + 1]
      );
      for (const [sIdx, section] of chapter.sections.entries()) {
        await tx.query("INSERT INTO content (id, type) VALUES ($1, $2)", [section.id, ContentType.book_section]);
        await tx.query(
          "INSERT INTO book_section (id, chapter_id, position, name, description, rubric) VALUES ($1, $2, $3, $4, $5, $6)",
          [section.id, chapter.id, sIdx + 1, section.name, section.description ?? null, section.rubric ?? null]
        );
        await insertInitialSlide(tx, section.id, ContentType.book_section);
      }
    }
  });
  return bookId;
}

/** Adds a single chapter to an existing book. Returns the new chapter ID. */
export async function createBookChapter(
  db: PGliteWithLive,
  bookId: string,
  data: { name: string; description: string | null },
  position: number
): Promise<string> {
  const chapterId = uuidv7();
  await db.transaction(async (tx) => {
    await tx.query("INSERT INTO content (id, type) VALUES ($1, $2)", [chapterId, ContentType.book_chapter]);
    await tx.query(
      "INSERT INTO book_chapter (id, name, description) VALUES ($1, $2, $3)",
      [chapterId, data.name, data.description]
    );
    await tx.query(
      "INSERT INTO book_chapter_link (book_id, chapter_id, position) VALUES ($1, $2, $3)",
      [bookId, chapterId, position]
    );
  });
  return chapterId;
}

/** Adds a single section to an existing chapter. Returns the new section ID. */
export async function createBookSection(
  db: PGliteWithLive,
  chapterId: string,
  data: { name: string; description: string | null; rubric: string | null },
  position: number
): Promise<string> {
  const sectionId = uuidv7();
  await db.transaction(async (tx) => {
    await tx.query("INSERT INTO content (id, type) VALUES ($1, $2)", [sectionId, ContentType.book_section]);
    await tx.query(
      "INSERT INTO book_section (id, chapter_id, position, name, description, rubric) VALUES ($1, $2, $3, $4, $5, $6)",
      [sectionId, chapterId, position, data.name, data.description, data.rubric]
    );
    await insertInitialSlide(tx, sectionId, ContentType.book_section);
  });
  return sectionId;
}
