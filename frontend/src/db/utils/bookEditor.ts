import type { components } from "@/db/models";
import { BlockType } from "@/db/models";
import { uuidv7 } from "uuidv7";
import type { CopiedBookNode } from "./bookTree";

type SlideView = components["schemas"]["SlideView"];

/**
 * A node in the editor's local tree. Carries its own slides so the whole book can be
 * loaded once, edited entirely in local state (Immer), and written back in one save —
 * no per-action database round-trips. Parents keep `slides` empty (slides live on leaves).
 */
export interface EditorNode {
  id: string;
  name: string;
  description: string;
  slides: SlideView[];
  children: EditorNode[];
}

export interface BookMeta {
  name: string;
  author: string;
  description: string;
  isbn: string;
}

export interface EditorState {
  meta: BookMeta;
  nodes: EditorNode[];
}

/** Flat node row as returned by get_book_full (pre-ordered, with slides). */
export type FlatEditorNode = {
  node_id: string;
  parent_id: string | null;
  position: number;
  name: string;
  description?: string;
  slides: SlideView[];
};

/** Assemble the flat get_book_full rows into the nested editor tree (order preserved). */
export function buildEditorTree(flat: FlatEditorNode[]): EditorNode[] {
  const byId = new Map<string, EditorNode>();
  const roots: EditorNode[] = [];
  for (const n of flat) {
    byId.set(n.node_id, { id: n.node_id, name: n.name, description: n.description ?? "", slides: n.slides ?? [], children: [] });
  }
  for (const n of flat) {
    const node = byId.get(n.node_id)!;
    const parent = n.parent_id ? byId.get(n.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** True if the node has any non-empty slide block (real content, not just a placeholder). */
export function editorHasContent(node: EditorNode): boolean {
  return node.slides.some((s) => s.slide_rows.some((r) => r.slide_columns.some((c) => c.blocks.some((b) => (b.content ?? "").trim() !== ""))));
}

/** First node at/under `node` that holds slides (a leaf) — what a parent's play presents. */
export function editorPresentId(node: EditorNode): string | undefined {
  if (node.slides.length > 0) return node.id;
  for (const child of node.children) {
    const found = editorPresentId(child);
    if (found) return found;
  }
  return undefined;
}

function cloneSlidesFresh(slides: SlideView[]): SlideView[] {
  return slides.map((s) => ({
    slide_id: uuidv7(),
    position: s.position,
    slide_rows: s.slide_rows.map((r) => ({
      id: uuidv7(),
      position: r.position,
      columns: r.columns,
      slide_columns: r.slide_columns.map((c) => ({
        id: uuidv7(),
        position: c.position,
        language: c.language,
        blocks: c.blocks.map((b) => ({ id: uuidv7(), position: b.position, content: b.content, metadata: b.metadata ?? { type: BlockType.paragraph } })),
      })),
    })),
  }));
}

/** Serialize an editor node subtree into the (id-free) clipboard shape. */
export function toCopied(node: EditorNode): CopiedBookNode {
  return {
    name: node.name,
    description: node.description || null,
    slides: node.slides,
    children: node.children.map(toCopied),
  };
}

/** Rebuild an editor subtree from the clipboard, generating fresh ids for nodes + slides. */
export function fromCopied(copied: CopiedBookNode): EditorNode {
  return {
    id: uuidv7(),
    name: copied.name,
    description: copied.description ?? "",
    slides: cloneSlidesFresh(copied.slides),
    children: copied.children.map(fromCopied),
  };
}

function newLeaf(data: { name: string; description: string }): EditorNode {
  // New leaves carry no slides yet; saveBookEdit seeds an empty slide for any leaf on persist.
  return { id: uuidv7(), name: data.name, description: data.description, slides: [], children: [] };
}

export function findNode(nodes: EditorNode[], id: string): EditorNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return undefined;
}

function removeFromTree(nodes: EditorNode[], id: string): boolean {
  const i = nodes.findIndex((n) => n.id === id);
  if (i !== -1) {
    nodes.splice(i, 1);
    return true;
  }
  for (const n of nodes) if (removeFromTree(n.children, id)) return true;
  return false;
}

function moveInTree(nodes: EditorNode[], id: string, dir: -1 | 1): boolean {
  const i = nodes.findIndex((n) => n.id === id);
  if (i !== -1) {
    const j = i + dir;
    if (j >= 0 && j < nodes.length) [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
    return true;
  }
  for (const n of nodes) if (moveInTree(n.children, id, dir)) return true;
  return false;
}

type NodeData = { name: string; description: string };

/** Actions a row can dispatch, including the non-mutating "copy" (handled by the page). */
export type RowAction = EditorAction | { type: "copy"; id: string };
export type EditorDispatch = (action: RowAction) => void;

export type EditorAction =
  | { type: "editMeta"; data: BookMeta }
  | { type: "rename"; id: string; data: NodeData }
  | { type: "addRoot"; data: NodeData }
  | { type: "addChild"; parentId: string; data: NodeData }
  | { type: "remove"; id: string }
  | { type: "move"; id: string; dir: -1 | 1 }
  | { type: "pasteRoot" }
  | { type: "pasteChild"; parentId: string };

/**
 * Apply a local edit to the Immer draft. Pure tree mutation — no I/O. Adding/pasting a
 * child clears the parent's slides (a node with children is structural). `clip` is the
 * clipboard subtree for paste actions.
 */
export function editorReducer(draft: EditorState, action: EditorAction, clip: CopiedBookNode | null): void {
  switch (action.type) {
    case "editMeta":
      draft.meta = { ...action.data };
      break;
    case "rename": {
      const n = findNode(draft.nodes, action.id);
      if (n) {
        n.name = action.data.name;
        n.description = action.data.description;
      }
      break;
    }
    case "addRoot":
      draft.nodes.push(newLeaf(action.data));
      break;
    case "addChild": {
      const p = findNode(draft.nodes, action.parentId);
      if (p) {
        p.slides = [];
        p.children.push(newLeaf(action.data));
      }
      break;
    }
    case "remove":
      removeFromTree(draft.nodes, action.id);
      break;
    case "move":
      moveInTree(draft.nodes, action.id, action.dir);
      break;
    case "pasteRoot":
      if (clip) draft.nodes.push(fromCopied(clip));
      break;
    case "pasteChild": {
      const p = findNode(draft.nodes, action.parentId);
      if (p && clip) {
        p.slides = [];
        p.children.push(fromCopied(clip));
      }
      break;
    }
  }
}
