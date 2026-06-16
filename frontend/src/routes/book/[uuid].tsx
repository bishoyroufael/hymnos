import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePGlite } from "@electric-sql/pglite-react";
import { produce } from "immer";
import { FiBook, FiClipboard, FiDownload, FiEdit2, FiHash, FiList, FiPlus, FiSave, FiTrash2, FiUser } from "react-icons/fi";
import { toast } from "react-toastify";
import { getBookForEdit } from "@/db/crud/read/liturgy";
import { saveBookEdit } from "@/db/crud/update/liturgy";
import { deleteBook } from "@/db/crud/delete/liturgy";
import { exportResourceAsZip, downloadBlob } from "@/db/utils/export";
import { editorHasContent, editorReducer, findNode, toCopied, type EditorNode, type EditorState, type RowAction } from "@/db/utils/bookEditor";
import useHymnosStore from "@/store";
import BookNodeRow from "@/components/liturgy/BookNodeRow";
import DeleteModal from "@/components/base/DeleteModal";
import EditModal from "@/components/base/EditModal";

const BOOK_FIELDS = [
  { key: "name", label: "اسم الكتاب", required: true, placeholder: "اسم الكتاب" },
  { key: "author", label: "المؤلف", placeholder: "اسم المؤلف" },
  { key: "description", label: "الوصف", multiline: true, placeholder: "وصف الكتاب" },
  { key: "isbn", label: "رقم ISBN", placeholder: "978-XXXXXXXXXX" },
];

const NODE_FIELDS = [
  { key: "name", label: "الاسم", required: true, placeholder: "الاسم" },
  { key: "description", label: "الوصف", multiline: true, placeholder: "الوصف (اختياري)" },
];

export default function BookPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const db = usePGlite();
  const navigate = useNavigate();

  const copiedNode = useHymnosStore((s) => s.copiedNode);

  // The entire book lives in local state; edits are local until the user submits.
  const [draft, setDraft] = useState<EditorState | null>(null);
  // Latest draft, so the stable `dispatch` can read it (copy/guards) without depending on it.
  const draftRef = useRef<EditorState | null>(null);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [modal, setModal] = useState<null | "editBook" | "addRoot">(null);
  const [deleteBookModal, setDeleteBookModal] = useState(false);

  const counts = useMemo(() => {
    let nodes = 0;
    let slides = 0;
    const walk = (ns: EditorNode[]) =>
      ns.forEach((n) => {
        nodes++;
        slides += n.slides.length;
        walk(n.children);
      });
    if (draft) walk(draft.nodes);
    return { nodes, slides };
  }, [draft]);

  // ── load (DB -> local state) ──
  useEffect(() => {
    if (!db || !uuid) return;
    setLoading(true);
    getBookForEdit(db, uuid)
      .then((result) => {
        if (!result) setError("لم يتم العثور على الكتاب");
        else {
          setDraft(result);
          setDirty(false);
        }
      })
      .catch(() => setError("حدث خطأ أثناء تحميل الكتاب"))
      .finally(() => setLoading(false));
  }, [db, uuid]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ── single dispatch for all local edits (stable so memoized rows don't churn) ──
  const dispatch = useCallback((action: RowAction) => {
    const store = useHymnosStore.getState();

    if (action.type === "copy") {
      const node = findNode(draftRef.current?.nodes ?? [], action.id);
      if (node) {
        store.setCopiedNode(toCopied(node));
        toast.success("تم نسخ العنصر");
      }
      return;
    }

    // A leaf with real content can't gain children.
    if (action.type === "addChild" || action.type === "pasteChild") {
      const parent = findNode(draftRef.current?.nodes ?? [], action.parentId);
      if (parent && parent.children.length === 0 && editorHasContent(parent)) {
        toast.warning("لا يمكن إضافة عناصر فرعية لعقدة تحتوي على شرائح. احذف شرائحها أولاً.");
        return;
      }
    }

    const clip = store.copiedNode;
    if ((action.type === "pasteChild" || action.type === "pasteRoot") && !clip) return;

    setDraft((d) => (d ? produce(d, (dr) => editorReducer(dr, action, clip)) : d));
    setDirty(true);

    if (action.type === "pasteChild" || action.type === "pasteRoot") {
      store.setCopiedNode(null); // consume the clipboard once pasted
      toast.success("تم لصق العنصر");
    }
  }, []);

  // ── submit (local state -> DB) ──
  const submit = async () => {
    if (!db || !uuid || !draft) return;
    setSaving(true);
    try {
      await saveBookEdit(db, uuid, draft.meta, draft.nodes);
      const fresh = await getBookForEdit(db, uuid); // re-sync ids / seeded slides
      if (fresh) setDraft(fresh);
      setDirty(false);
      toast.success("تم حفظ الكتاب");
    } catch (e) {
      console.error("Failed to save book:", e);
      toast.error("تعذّر حفظ الكتاب");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!db || !uuid) return;
    setExporting(true);
    try {
      const { blob, filename } = await exportResourceAsZip(db, uuid);
      downloadBlob(blob, filename);
      toast.success("تم تحميل الكتاب");
    } catch (e) {
      console.error("Export failed:", e);
      toast.error("تعذّر تحميل الكتاب");
    } finally {
      setExporting(false);
    }
  };

  const confirmDeleteBook = async () => {
    if (!db || !uuid) return;
    try {
      await deleteBook(db, uuid);
      toast.success("تم حذف الكتاب");
      navigate("/");
    } catch (e) {
      console.error("Failed to delete book:", e);
      toast.error("تعذّر حذف الكتاب");
    }
  };

  // ── render states ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="p-8 max-w-4xl mx-auto" dir="rtl">
        <div className="alert alert-error">
          <span>{error ?? "لم يتم العثور على الكتاب"}</span>
        </div>
        <button className="btn btn-ghost mt-4" onClick={() => navigate(-1)}>
          العودة
        </button>
      </div>
    );
  }

  const { meta, nodes } = draft;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 max-w-4xl mx-auto" dir="rtl">
      {/* ── Book Header ── */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <FiBook className="w-8 h-8 mt-1 text-primary shrink-0" />
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold">{meta.name}</h1>
                {meta.author && (
                  <p className="flex items-center gap-1 text-base-content/70">
                    <FiUser className="w-4 h-4" />
                    {meta.author}
                  </p>
                )}
                {meta.isbn && (
                  <p className="flex items-center gap-1 text-base-content/50 text-sm">
                    <FiHash className="w-3 h-3" />
                    ISBN: {meta.isbn}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                title={dirty ? "احفظ التغييرات أولاً للتحميل" : "تحميل الكتاب"}
                aria-label="تحميل الكتاب"
                onClick={handleExport}
                disabled={exporting || dirty}
              >
                {exporting ? <span className="loading loading-spinner loading-xs" /> : <FiDownload aria-hidden className="w-4 h-4" />}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                title="تعديل الكتاب"
                aria-label="تعديل الكتاب"
                onClick={() => setModal("editBook")}
              >
                <FiEdit2 aria-hidden className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square text-error"
                title="حذف الكتاب"
                aria-label="حذف الكتاب"
                onClick={() => setDeleteBookModal(true)}
              >
                <FiTrash2 aria-hidden className="w-4 h-4" />
              </button>
            </div>
          </div>
          {meta.description && <p className="text-base-content/70 text-sm leading-relaxed">{meta.description}</p>}
          <div className="flex items-center gap-4 text-xs text-base-content/50 pt-1">
            <span>{counts.nodes} عنصر</span>
            <span>{counts.slides} شريحة</span>
          </div>
        </div>
      </div>

      {/* ── Node tree ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FiList className="w-5 h-5 text-primary" />
            فهرس المحتوي
          </h2>
          <button type="button" className={`btn btn-sm gap-2 ${dirty ? "btn-primary" : "btn-ghost"}`} onClick={submit} disabled={!dirty || saving}>
            حفظ
            {saving ? <span className="loading loading-spinner loading-xs" /> : <FiSave className="w-4 h-4" />}
          </button>
        </div>

        {nodes.length === 0 ? (
          <p className="text-center text-base-content/50 py-6">لا توجد عناصر في هذا الكتاب</p>
        ) : (
          <ul className="menu menu-md bg-base-200 rounded-box w-full p-2">
            {nodes.map((node, i) => (
              <BookNodeRow
                key={node.id}
                node={node}
                bookId={uuid!}
                dispatch={dispatch}
                dirty={dirty}
                isFirst={i === 0}
                isLast={i === nodes.length - 1}
              />
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <button type="button" className="btn btn-outline btn-sm gap-2 flex-1 border-dashed" onClick={() => setModal("addRoot")}>
            <FiPlus className="w-4 h-4" />
            إضافة عنصر
          </button>
          {copiedNode && (
            <button type="button" className="btn btn-outline btn-sm gap-2 text-primary" onClick={() => dispatch({ type: "pasteRoot" })}>
              <FiClipboard className="w-4 h-4" />
              لصق عنصر
            </button>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {modal === "editBook" && (
        <EditModal
          title="تعديل الكتاب"
          fields={BOOK_FIELDS}
          initial={{ name: meta.name, author: meta.author, description: meta.description, isbn: meta.isbn }}
          onSave={(v) =>
            dispatch({
              type: "editMeta",
              data: { name: v.name.trim(), author: v.author.trim(), description: v.description.trim(), isbn: v.isbn.trim() },
            })
          }
          onClose={() => setModal(null)}
        />
      )}
      {modal === "addRoot" && (
        <EditModal
          title="عنصر جديد"
          saveLabel="إضافة"
          fields={NODE_FIELDS}
          initial={{ name: "", description: "" }}
          onSave={(v) => dispatch({ type: "addRoot", data: { name: v.name.trim(), description: v.description.trim() } })}
          onClose={() => setModal(null)}
        />
      )}
      {deleteBookModal && (
        <DeleteModal
          title="حذف الكتاب"
          message={`هل أنت متأكد من حذف "${meta.name}"؟ سيتم حذف جميع العناصر والشرائح المرتبطة به.`}
          onConfirm={confirmDeleteBook}
          onCancel={() => setDeleteBookModal(false)}
        />
      )}
    </div>
  );
}
