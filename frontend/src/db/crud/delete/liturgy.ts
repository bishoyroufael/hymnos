import type { PGliteWithLive } from "@electric-sql/pglite/live";

/**
 * Deletes an entire book and every node under it.
 *
 * The cascade only flows content -> subtype (book_node.id REFERENCES content), not the
 * reverse, so we must delete the content rows of all nodes explicitly. book_id is
 * denormalized on every node, so all node content rows are a single flat query away;
 * deleting them cascades to book_node rows and their slides.
 */
export async function deleteBook(db: PGliteWithLive, bookId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.query("DELETE FROM content WHERE id IN (SELECT id FROM book_node WHERE book_id = $1)", [bookId]);
    await tx.query("DELETE FROM content WHERE id = $1", [bookId]);
  });
}
