import type { components } from "@/db/models";
import type { PGliteWithLive } from "@electric-sql/pglite/live";

type Book = components["schemas"]["Book"];
export type BooksPagedResult = { items: Book[]; total: number };

type BookView = components["schemas"]["BookView"];
type BookSectionView = components["schemas"]["BookSectionView"];

/**
 * Get book by ID
 */
export async function getBook(db: PGliteWithLive, id: string): Promise<BookView | undefined> {
  const results = await db.query("SELECT book FROM view_book_json WHERE book_id=$1;", [id]);
  if (results.rows.length === 0) {
    return undefined;
  }
  return (results.rows[0] as { book: BookView }).book;
}

/**
 * Get paginated list of books ordered by name
 */
export async function getBooksPaged(
  db: PGliteWithLive,
  page: number,
  pageSize: number
): Promise<BooksPagedResult> {
  const offset = (page - 1) * pageSize;
  const [itemsResult, countResult] = await Promise.all([
    db.query<Book>(
      "SELECT id, name, author, description FROM book ORDER BY name LIMIT $1 OFFSET $2",
      [pageSize, offset]
    ),
    db.query<{ total: string }>("SELECT COUNT(*) AS total FROM book"),
  ]);
  return {
    items: itemsResult.rows,
    total: parseInt(countResult.rows[0]?.total ?? "0", 10),
  };
}

/**
 * Get the parent book of a book section, resolved via the chapter-link table.
 */
export async function getBookBySectionId(db: PGliteWithLive, sectionId: string): Promise<BookView | undefined> {
  const results = await db.query(
    `SELECT book FROM view_book_json WHERE book_id = (
       SELECT bcl.book_id FROM book_chapter_link bcl
       JOIN book_section bs ON bs.chapter_id = bcl.chapter_id
       WHERE bs.id = $1
       LIMIT 1
     )`,
    [sectionId]
  );
  if (results.rows.length === 0) return undefined;
  return (results.rows[0] as { book: BookView }).book;
}

/**
 * Get book section by ID
 */
export async function getBookSection(db: PGliteWithLive, id: string): Promise<BookSectionView | undefined> {
  const results = await db.query("SELECT section FROM view_book_section_json WHERE section_id=$1;", [id]);
  if (results.rows.length === 0) {
    return undefined;
  }
  return (results.rows[0] as { section: BookSectionView }).section;
}
