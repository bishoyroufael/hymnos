import type { PGliteWithLive } from "@electric-sql/pglite/live";
import { ContentType } from "@/db/models";
import { uuidv7 } from "uuidv7";
import { insertInitialSlide } from "./slide";

interface Queryable {
  query<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

/** A node in the create-book tree. Children nest to any depth. */
export interface BookNodeInput {
  id: string;
  name: string;
  description?: string;
  children?: BookNodeInput[];
}

export interface BookCreateInput {
  name: string;
  author?: string;
  description?: string;
  isbn?: string;
  nodes: BookNodeInput[];
}

/** Inserts a single node row (content + book_node). Leaf nodes get an initial empty slide. */
async function insertNode(
  tx: Queryable,
  bookId: string,
  parentId: string | null,
  position: number,
  node: BookNodeInput,
): Promise<void> {
  await tx.query("INSERT INTO content (id, type) VALUES ($1, $2)", [node.id, ContentType.book_node]);
  await tx.query(
    "INSERT INTO book_node (id, book_id, parent_id, position, name, description) VALUES ($1, $2, $3, $4, $5, $6)",
    [node.id, bookId, parentId, position, node.name, node.description ?? null],
  );

  const children = node.children ?? [];
  if (children.length === 0) {
    // A leaf node is where slides live; seed one empty slide so it's presentable.
    await insertInitialSlide(tx, node.id, ContentType.book_node);
    return;
  }
  for (const [idx, child] of children.entries()) {
    await insertNode(tx, bookId, node.id, idx + 1, child);
  }
}

/** Creates a full book and its node tree in one transaction. Returns the new book ID. */
export async function createBook(db: PGliteWithLive, input: BookCreateInput): Promise<string> {
  const bookId = uuidv7();
  await db.transaction(async (tx) => {
    await tx.query("INSERT INTO content (id, type) VALUES ($1, $2)", [bookId, ContentType.book]);
    await tx.query(
      "INSERT INTO book (id, name, author, description, isbn) VALUES ($1, $2, $3, $4, $5)",
      [bookId, input.name, input.author ?? null, input.description ?? null, input.isbn ?? null],
    );
    for (const [idx, node] of input.nodes.entries()) {
      await insertNode(tx, bookId, null, idx + 1, node);
    }
  });
  return bookId;
}
