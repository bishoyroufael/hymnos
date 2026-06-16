import type { components } from "@/db/models";
import type { PGliteWithLive } from "@electric-sql/pglite/live";
import { buildEditorTree, type EditorNode, type BookMeta, type FlatEditorNode } from "@/db/utils/bookEditor";

type Book = components["schemas"]["Book"];
export type BooksPagedResult = { items: Book[]; total: number };

type BookView = components["schemas"]["BookView"];
type ContentSlidesView = components["schemas"]["ContentSlidesView"];
type SlideView = components["schemas"]["SlideView"];

/**
 * Get a book with its full node tree (flat, pre-ordered nodes). Slide content is
 * fetched separately per node via getNodeSlides.
 */
export async function getBook(db: PGliteWithLive, id: string): Promise<BookView | undefined> {
  const results = await db.query("SELECT get_book_tree($1) AS book;", [id]);
  const book = (results.rows[0] as { book: BookView | null } | undefined)?.book;
  return book ?? undefined;
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
 * Get the parent book of a node. book_id is denormalized on every node, so this is
 * a single FK hop (no ancestry walk).
 */
export async function getBookByNodeId(db: PGliteWithLive, nodeId: string): Promise<BookView | undefined> {
  const results = await db.query(
    "SELECT get_book_tree(n.book_id) AS book FROM book_node n WHERE n.id = $1",
    [nodeId]
  );
  const book = (results.rows[0] as { book: BookView | null } | undefined)?.book;
  return book ?? undefined;
}

/**
 * Load a whole book for the editor: metadata + the full node tree WITH every node's
 * slides, in one query (get_book_full). This is the only read the editor needs — all
 * edits then happen in local state and saveBookEdit writes the whole book back.
 */
export async function getBookForEdit(db: PGliteWithLive, bookId: string): Promise<{ meta: BookMeta; nodes: EditorNode[] } | undefined> {
  const results = await db.query("SELECT get_book_full($1) AS book;", [bookId]);
  const full = (results.rows[0] as { book: { name: string; author?: string; description?: string; isbn?: string; nodes: FlatEditorNode[] } | null } | undefined)?.book;
  if (!full) return undefined;
  return {
    meta: { name: full.name, author: full.author ?? "", description: full.description ?? "", isbn: full.isbn ?? "" },
    nodes: buildEditorTree(full.nodes),
  };
}

/** Get a node's metadata + its parent node's name + its book's name. Used for recently-viewed labels. */
export async function getBookNode(
  db: PGliteWithLive,
  id: string
): Promise<{ name: string; description: string | null; parent_name: string | null; book_name: string | null } | undefined> {
  const results = await db.query<{ name: string; description: string | null; parent_name: string | null; book_name: string | null }>(
    `SELECT n.name, n.description, p.name AS parent_name, b.name AS book_name
     FROM book_node n
     LEFT JOIN book_node p ON p.id = n.parent_id
     JOIN book b ON b.id = n.book_id
     WHERE n.id = $1`,
    [id]
  );
  return results.rows[0];
}

/**
 * Get the slides attached directly to a single book node, using the generic
 * get_content_slides function.
 */
export async function getNodeSlides(db: PGliteWithLive, nodeId: string): Promise<SlideView[]> {
  const results = await db.query("SELECT get_content_slides($1)::json AS r;", [nodeId]);
  const r = (results.rows[0] as { r: ContentSlidesView } | undefined)?.r;
  return r?.slides ?? [];
}
