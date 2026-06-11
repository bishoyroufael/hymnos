import type { PGliteWithLive } from "@electric-sql/pglite/live";

export async function updateBook(
  db: PGliteWithLive,
  id: string,
  data: { name: string; author: string | null; description: string | null; isbn: string | null }
): Promise<void> {
  await db.query(
    "UPDATE book SET name=$1, author=$2, description=$3, isbn=$4 WHERE id=$5",
    [data.name, data.author, data.description, data.isbn, id]
  );
}

export async function updateBookChapter(
  db: PGliteWithLive,
  id: string,
  data: { name: string; description: string | null }
): Promise<void> {
  await db.query(
    "UPDATE book_chapter SET name=$1, description=$2 WHERE id=$3",
    [data.name, data.description, id]
  );
}

export async function updateBookSection(
  db: PGliteWithLive,
  id: string,
  data: { name: string; description: string | null; rubric: string | null }
): Promise<void> {
  await db.query(
    "UPDATE book_section SET name=$1, description=$2, rubric=$3 WHERE id=$4",
    [data.name, data.description, data.rubric, id]
  );
}
