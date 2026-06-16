import type { PGliteWithLive } from "@electric-sql/pglite/live";
import { ContentType } from "@/db/models";
import { insertInitialSlide, insertSlidesWithIds } from "../create/slide";
import type { EditorNode, BookMeta } from "@/db/utils/bookEditor";

interface Queryable {
  query<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

/** Inserts one editor node (content + book_node + its slides), then recurses into children. */
async function insertEditorNode(tx: Queryable, bookId: string, parentId: string | null, position: number, node: EditorNode): Promise<void> {
  await tx.query("INSERT INTO content (id, type) VALUES ($1, $2)", [node.id, ContentType.book_node]);
  await tx.query(
    "INSERT INTO book_node (id, book_id, parent_id, position, name, description) VALUES ($1, $2, $3, $4, $5, $6)",
    [node.id, bookId, parentId, position, node.name, node.description || null],
  );

  if (node.children.length === 0) {
    // Leaves hold slides. Preserve loaded ids; seed an empty slide for new/emptied leaves.
    if (node.slides.length === 0) await insertInitialSlide(tx, node.id, ContentType.book_node);
    else await insertSlidesWithIds(tx, node.id, ContentType.book_node, node.slides);
    return;
  }
  for (const [idx, child] of node.children.entries()) {
    await insertEditorNode(tx, bookId, node.id, idx + 1, child);
  }
}

/**
 * Persist the editor's local state for a whole book in one transaction: update metadata,
 * wipe the book's existing nodes (cascading their slides), then re-insert the entire tree
 * from local state. Node and slide ids are preserved, so deep links stay stable. This is
 * the editor's single write — the counterpart of getBookForEdit's single read.
 */
export async function saveBookEdit(db: PGliteWithLive, bookId: string, meta: BookMeta, nodes: EditorNode[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.query("UPDATE book SET name=$1, author=$2, description=$3, isbn=$4 WHERE id=$5", [
      meta.name,
      meta.author || null,
      meta.description || null,
      meta.isbn || null,
      bookId,
    ]);
    // Wipe existing nodes (cascade removes book_node rows + their slides).
    await tx.query("DELETE FROM content WHERE id IN (SELECT id FROM book_node WHERE book_id = $1)", [bookId]);
    for (const [idx, root] of nodes.entries()) {
      await insertEditorNode(tx, bookId, null, idx + 1, root);
    }
  });
}
