import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowDown, FiArrowUp, FiClipboard, FiCopy, FiEdit2, FiPlay, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { editorHasContent, editorPresentId, type EditorDispatch, type EditorNode } from "@/db/utils/bookEditor";
import useHymnosStore from "@/store";
import DeleteModal from "@/components/base/DeleteModal";
import EditModal from "@/components/base/EditModal";

const NODE_FIELDS = [
  { key: "name", label: "الاسم", required: true, placeholder: "الاسم" },
  { key: "description", label: "الوصف", multiline: true, placeholder: "الوصف (اختياري)" },
];

interface BookNodeRowProps {
  node: EditorNode;
  bookId: string;
  dispatch: EditorDispatch;
  /** Unsaved local edits exist — presenting reads the DB, so it's disabled until saved. */
  dirty: boolean;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Recursive editor row for one node, rendered as a daisyUI menu <li>. All edits go through
 * the page-level `dispatch` (local Immer state); this component performs no I/O. Memoized:
 * thanks to Immer's structural sharing, only nodes on a changed path re-render.
 *
 * The <details> is left uncontrolled (native daisyUI collapsible) so expand/collapse is a
 * pure browser toggle and never triggers a React re-render — which was spiking INP. The
 * literal `open` prop only sets the default on mount; React never re-applies an unchanged
 * prop, so the user's native toggling is preserved across re-renders.
 */
function BookNodeRow({ node, bookId, dispatch, dirty, isFirst, isLast }: BookNodeRowProps) {
  const navigate = useNavigate();
  const copiedNode = useHymnosStore((s) => s.copiedNode);

  const [modal, setModal] = useState<null | "edit" | "addChild">(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isLeaf = node.children.length === 0;
  // A leaf with real slide content can't gain children; parents always can.
  const canAddChildren = !isLeaf || !editorHasContent(node);
  // Leaf -> present itself; parent -> present its first descendant's slides.
  const presentId = editorPresentId(node);

  const present = () => {
    if (dirty) {
      toast.info("احفظ التغييرات أولاً لعرض الشرائح");
      return;
    }
    if (presentId) navigate(`/presentation/${bookId}?startSlide=${presentId}`);
  };

  const openAddChild = () => {
    if (canAddChildren) setModal("addChild");
    else toast.warning("لا يمكن إضافة عناصر فرعية لعقدة تحتوي على شرائح. احذف شرائحها أولاً.");
  };

  // stopPropagation so action clicks don't toggle the native <details>.
  const act = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  const label = (
    <span className="flex flex-col items-start text-right min-w-0">
      <span className="font-bold text-sm truncate w-full">{node.name}</span>
      {node.description && <span className="text-xs opacity-60 truncate w-full">{node.description}</span>}
    </span>
  );

  const actions = (
    <span className="flex items-center gap-0.5 shrink-0">
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-square"
        title="تحريك لأعلى"
        aria-label="تحريك لأعلى"
        disabled={isFirst}
        onClick={act(() => dispatch({ type: "move", id: node.id, dir: -1 }))}
      >
        <FiArrowUp aria-hidden className="w-3 h-3" />
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-square"
        title="تحريك لأسفل"
        aria-label="تحريك لأسفل"
        disabled={isLast}
        onClick={act(() => dispatch({ type: "move", id: node.id, dir: 1 }))}
      >
        <FiArrowDown aria-hidden className="w-3 h-3" />
      </button>
      {presentId && (
        <button type="button" className="btn btn-ghost btn-xs btn-square" title="عرض" aria-label="عرض" onClick={act(present)}>
          <FiPlay aria-hidden className={`w-3 h-3 ${dirty ? "opacity-40" : "text-primary"}`} />
        </button>
      )}
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-square"
        title="نسخ"
        aria-label="نسخ"
        onClick={act(() => dispatch({ type: "copy", id: node.id }))}
      >
        <FiCopy aria-hidden className="w-3 h-3" />
      </button>
      {copiedNode && canAddChildren && (
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-square text-primary"
          title="لصق بالداخل"
          aria-label="لصق بالداخل"
          onClick={act(() => dispatch({ type: "pasteChild", parentId: node.id }))}
        >
          <FiClipboard aria-hidden className="w-3 h-3" />
        </button>
      )}
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-square"
        title="إضافة عنصر فرعي"
        aria-label="إضافة عنصر فرعي"
        onClick={act(openAddChild)}
      >
        <FiPlus aria-hidden className="w-3 h-3" />
      </button>
      <button type="button" className="btn btn-ghost btn-xs btn-square" title="تعديل" aria-label="تعديل" onClick={act(() => setModal("edit"))}>
        <FiEdit2 aria-hidden className="w-3 h-3" />
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-square text-error"
        title="حذف"
        aria-label="حذف"
        onClick={act(() => setDeleteOpen(true))}
      >
        <FiTrash2 aria-hidden className="w-3 h-3" />
      </button>
    </span>
  );

  return (
    <li>
      {!isLeaf ? (
        <details open className="group">
          <summary className="gap-1 after:-order-1 after:ms-0 after:m-2 after:rotate-135! rtl:after:-rotate-45! group-open:after:-rotate-135!">
            {label}
            <span className="flex-1" />
            {actions}
          </summary>
          <ul>
            {node.children.map((child, i) => (
              <BookNodeRow
                key={child.id}
                node={child}
                bookId={bookId}
                dispatch={dispatch}
                dirty={dirty}
                isFirst={i === 0}
                isLast={i === node.children.length - 1}
              />
            ))}
          </ul>
        </details>
      ) : (
        <a className="gap-1" onClick={presentId ? present : undefined}>
          {label}
          <span className="flex-1" />
          {actions}
        </a>
      )}

      {modal === "edit" && (
        <EditModal
          title="تعديل العنصر"
          fields={NODE_FIELDS}
          initial={{ name: node.name, description: node.description }}
          onSave={(v) => dispatch({ type: "rename", id: node.id, data: { name: v.name.trim(), description: v.description.trim() } })}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "addChild" && (
        <EditModal
          title="عنصر فرعي جديد"
          saveLabel="إضافة"
          fields={NODE_FIELDS}
          initial={{ name: "", description: "" }}
          onSave={(v) => dispatch({ type: "addChild", parentId: node.id, data: { name: v.name.trim(), description: v.description.trim() } })}
          onClose={() => setModal(null)}
        />
      )}
      {deleteOpen && (
        <DeleteModal
          title="حذف العنصر"
          message={`هل أنت متأكد من حذف "${node.name}"؟ سيتم حذف جميع العناصر الفرعية والشرائح المرتبطة به.`}
          onConfirm={() => {
            dispatch({ type: "remove", id: node.id });
            setDeleteOpen(false);
          }}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </li>
  );
}

export default memo(BookNodeRow);
