import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBook } from "react-icons/fi";
import type { components } from "@/db/models";
import { usePresentation } from "@/contexts/PresentationContext";
import { buildNodeTree, firstSlideNodeId, type BookNode } from "@/db/utils/bookTree";

type BookView = components["schemas"]["BookView"];

export const BOOK_TOC_DRAWER_ID = "book-toc-drawer";

interface BookTocDrawerProps {
  book: BookView;
  theme: string;
  children: React.ReactNode;
}

/** Walk up the flat node list to collect a node's ancestor ids (for default-expand). */
function ancestorIds(nodes: BookView["nodes"], nodeId: string | undefined): string[] {
  if (!nodeId) return [];
  const byId = new Map(nodes.map((n) => [n.node_id, n]));
  const acc: string[] = [];
  let cur = byId.get(nodeId);
  while (cur?.parent_id) {
    acc.push(cur.parent_id);
    cur = byId.get(cur.parent_id);
  }
  return acc;
}

export default function BookTocDrawer({ book, theme, children }: BookTocDrawerProps) {
  const navigate = useNavigate();
  const { state, dispatch } = usePresentation();

  const isBookMode = state.contentType === "book";
  const tree = useMemo(() => buildNodeTree(book.nodes), [book.nodes]);

  // Derive the current node from segments (book mode) or the content id (single-node mode).
  let currentNodeId: string | undefined;
  if (isBookMode) {
    let offset = 0;
    for (const seg of state.segments) {
      if (state.currSlideIdx < offset + seg.slides.length) {
        currentNodeId = seg.content_id;
        break;
      }
      offset += seg.slides.length;
    }
  } else {
    currentNodeId = state.contentId ?? undefined;
  }

  // Lazy initializer: expand the current node's ancestor chain once on mount.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(ancestorIds(book.nodes, currentNodeId)));

  // Keep the current node's ancestors expanded as navigation moves through the book.
  useEffect(() => {
    const ancestors = ancestorIds(book.nodes, currentNodeId);
    if (ancestors.length) setExpanded((prev) => new Set([...prev, ...ancestors]));
  }, [currentNodeId, book.nodes]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleNodeClick = (nodeId: string) => {
    if (isBookMode) {
      let idx = 0;
      for (const seg of state.segments) {
        if (seg.content_id === nodeId) break;
        idx += seg.slides.length;
      }
      dispatch({ type: "SET_SLIDE_INDEX", payload: idx });
      const el = document.getElementById(BOOK_TOC_DRAWER_ID) as HTMLInputElement | null;
      if (el) el.checked = false;
    } else {
      navigate(`/presentation/${book.book_id}?startSlide=${nodeId}`);
    }
  };

  const renderNode = (node: BookNode) => {
    const hasChildren = node.children.length > 0;
    // Leaf -> itself; empty leaf -> not presentable.
    const presentId = firstSlideNodeId(node);
    const isActive = node.node_id === currentNodeId;

    if (!hasChildren) {
      // Leaf: clickable when it has slides, otherwise plain (empty structural leaf).
      return (
        <li key={node.node_id}>
          {presentId ? (
            <button
              type="button"
              className={`text-right${isActive ? " menu-active" : ""}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => handleNodeClick(presentId)}
            >
              {node.name}
            </button>
          ) : (
            <span className="text-right opacity-50">{node.name}</span>
          )}
        </li>
      );
    }

    return (
      <li key={node.node_id}>
        <details open={expanded.has(node.node_id)}>
          <summary
            className={`font-semibold${isActive ? " menu-active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              toggle(node.node_id);
            }}
          >
            {node.name}
          </summary>
          <ul>{node.children.map(renderNode)}</ul>
        </details>
      </li>
    );
  };

  return (
    <div data-theme={theme} className="drawer h-screen w-full">
      <input id={BOOK_TOC_DRAWER_ID} type="checkbox" className="drawer-toggle" />

      <div className="drawer-content">{children}</div>

      <div className="drawer-side z-30">
        <label htmlFor={BOOK_TOC_DRAWER_ID} aria-label="close sidebar" className="drawer-overlay" />
        <div className="bg-base-200 min-h-full w-80 flex flex-col" dir="rtl">
          {/* Header */}
          <div className="p-4 border-b border-base-300 flex items-center gap-2 shrink-0">
            <FiBook className="w-5 h-5 text-primary shrink-0" />
            <span className="font-bold text-lg truncate">{book.name}</span>
          </div>

          {/* TOC */}
          <ul className="menu menu-sm flex-1 overflow-y-auto p-2 w-full">{tree.map(renderNode)}</ul>
        </div>
      </div>
    </div>
  );
}
