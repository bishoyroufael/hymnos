import type { components } from "@/db/models";

type BookView = components["schemas"]["BookView"];
type SlideView = components["schemas"]["SlideView"];

/**
 * A detached copy of a node subtree (node + its slides + descendants), used for the
 * copy/paste clipboard. Holds no ids — fresh ids are generated on paste — so it can be
 * serialized to localStorage and pasted into any book.
 */
export interface CopiedBookNode {
  name: string;
  description: string | null;
  slides: SlideView[];
  children: CopiedBookNode[];
}

/** A flat node as returned by get_book_tree (pre-ordered, depth-annotated). */
export type BookNodeFlat = BookView["nodes"][number];

/** A node nested into the tree for rendering. children preserve sibling order. */
export type BookNode = BookNodeFlat & { children: BookNode[] };

/**
 * Assemble the flat, pre-ordered node list from get_book_tree into a nested tree.
 * Input order is preserved (pre-order DFS), so children arrays stay correctly ordered.
 */
export function buildNodeTree(nodes: BookNodeFlat[]): BookNode[] {
  const byId = new Map<string, BookNode>();
  const roots: BookNode[] = [];

  // First pass: wrap every node. Order is preserved by iterating the flat list.
  for (const n of nodes) {
    byId.set(n.node_id, { ...n, children: [] });
  }
  // Second pass: link each node to its parent (or collect as a root).
  for (const n of nodes) {
    const node = byId.get(n.node_id)!;
    const parent = n.parent_id ? byId.get(n.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/**
 * The id of the first slide-bearing node at or under `node`, in pre-order (depth-first).
 * For a leaf this is the node itself; for a structural parent it's its first descendant
 * leaf — used by the parent "play" action to present the first slides under it.
 */
export function firstSlideNodeId(node: BookNode): string | undefined {
  if (node.slide_count > 0) return node.node_id;
  for (const child of node.children) {
    const found = firstSlideNodeId(child);
    if (found) return found;
  }
  return undefined;
}
