import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePGlite } from "@electric-sql/pglite-react";
import { FiDownload, FiEdit2, FiMusic, FiTrash2, FiUser } from "react-icons/fi";
import { toast } from "react-toastify";
import type { components } from "@/db/models";
import { getHymnById } from "@/db/crud/read/hymn";
import { updateHymn } from "@/db/crud/update/hymn";
import { deleteHymn } from "@/db/crud/delete/hymn";
import { exportResourceAsZip, downloadBlob } from "@/db/utils/export";
import SlideCarousel from "@/components/presentation/SlideCarousel";
import DeleteModal from "@/components/base/DeleteModal";
import InlineField from "@/components/base/InlineField";
import SaveCancel from "@/components/base/SaveCancel";

type HymnView = components["schemas"]["HymnView"];

// ─── main page ────────────────────────────────────────────────────────────────

export default function HymnViewPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const db = usePGlite();
  const navigate = useNavigate();

  const [hymn, setHymn] = useState<HymnView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editingHymn, setEditingHymn] = useState(false);
  const [hymnEdit, setHymnEdit] = useState({ name: "", author: "", composer: "" });
  const [deleteModal, setDeleteModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const reload = async () => {
    if (!db || !uuid) return;
    const result = await getHymnById(db, uuid);
    if (result) setHymn(result);
  };

  useEffect(() => {
    if (!db || !uuid) return;
    setLoading(true);
    getHymnById(db, uuid)
      .then((result) => {
        if (!result) setError("لم يتم العثور على الترنيمة");
        else setHymn(result);
      })
      .catch(() => setError("حدث خطأ أثناء تحميل الترنيمة"))
      .finally(() => setLoading(false));
  }, [db, uuid]);

  const startEditHymn = () => {
    if (!hymn) return;
    setHymnEdit({ name: hymn.name, author: hymn.author ?? "", composer: hymn.composer ?? "" });
    setEditingHymn(true);
  };

  const saveHymnEdit = async () => {
    if (!db || !uuid || !hymnEdit.name.trim()) return;
    setSaving(true);
    try {
      await updateHymn(db, uuid, {
        name: hymnEdit.name.trim(),
        author: hymnEdit.author.trim() || null,
        composer: hymnEdit.composer.trim() || null,
      });
      setEditingHymn(false);
      await reload();
      toast.success("تم حفظ التعديلات");
    } catch (e) {
      console.error("Failed to save hymn:", e);
      toast.error("تعذّر حفظ التعديلات");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!db || !uuid) return;
    setSaving(true);
    try {
      await deleteHymn(db, uuid);
      toast.success("تم حذف الترنيمة");
      navigate(-1);
    } catch (e) {
      console.error("Failed to delete hymn:", e);
      toast.error("تعذّر حذف الترنيمة");
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!db || !uuid) return;
    setExporting(true);
    try {
      const { blob, filename } = await exportResourceAsZip(db, uuid);
      downloadBlob(blob, filename);
      toast.success("تم تحميل الترنيمة");
    } catch (e) {
      console.error("Export failed:", e);
      toast.error("تعذّر تحميل الترنيمة");
    } finally {
      setExporting(false);
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

  if (error || !hymn) {
    return (
      <div className="p-8 max-w-2xl mx-auto" dir="rtl">
        <div className="alert alert-error">
          <span>{error ?? "لم يتم العثور على الترنيمة"}</span>
        </div>
        <button className="btn btn-ghost mt-4" onClick={() => navigate(-1)}>
          العودة
        </button>
      </div>
    );
  }

  const slides = hymn.slides ?? [];

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 max-w-2xl mx-auto" dir="rtl">
      {/* ── Hymn Header ── */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body gap-3">
          {editingHymn ? (
            <>
              <InlineField
                label="اسم الترنيمة *"
                value={hymnEdit.name}
                onChange={(v) => setHymnEdit((p) => ({ ...p, name: v }))}
                placeholder="اسم الترنيمة"
              />
              <InlineField
                label="المؤلف"
                value={hymnEdit.author}
                onChange={(v) => setHymnEdit((p) => ({ ...p, author: v }))}
                placeholder="اسم المؤلف"
              />
              <InlineField
                label="الملحن"
                value={hymnEdit.composer}
                onChange={(v) => setHymnEdit((p) => ({ ...p, composer: v }))}
                placeholder="اسم الملحن"
              />
              <SaveCancel onSave={saveHymnEdit} onCancel={() => setEditingHymn(false)} saving={saving} />
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FiMusic className="w-8 h-8 mt-1 text-primary shrink-0" />
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold">{hymn.name}</h1>
                    {hymn.author && (
                      <p className="flex items-center gap-1 text-base-content/70">
                        <FiUser className="w-4 h-4" />
                        {hymn.author}
                      </p>
                    )}
                    {hymn.composer && <p className="text-sm text-base-content/50">الملحن: {hymn.composer}</p>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square"
                    title="تحميل الترنيمة"
                    aria-label="تحميل الترنيمة"
                    onClick={handleExport}
                    disabled={exporting}
                  >
                    {exporting ? <span className="loading loading-spinner loading-xs" /> : <FiDownload aria-hidden className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square"
                    title="تعديل الترنيمة"
                    aria-label="تعديل الترنيمة"
                    onClick={startEditHymn}
                  >
                    <FiEdit2 aria-hidden className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square text-error"
                    title="حذف الترنيمة"
                    aria-label="حذف الترنيمة"
                    onClick={() => setDeleteModal(true)}
                  >
                    <FiTrash2 aria-hidden className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {hymn.tags && hymn.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {hymn.tags.map((tag) => (
                    <span key={tag} className="badge badge-outline badge-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-xs text-base-content/50 pt-1">{slides.length} شريحة</div>
            </>
          )}
        </div>
      </div>

      {/* ── Slides ── */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body gap-4">
          <h2 className="card-title text-lg">الشرائح</h2>

          {slides.length === 0 ? (
            <p className="text-center text-base-content/50 py-8">لا توجد شرائح بعد</p>
          ) : (
            <SlideCarousel slides={slides} onPresent={() => navigate(`/presentation/${uuid}`)} />
          )}
        </div>
      </div>

      {/* ── Delete modal ── */}
      {deleteModal && (
        <DeleteModal
          title="حذف الترنيمة"
          message={`هل أنت متأكد من حذف "${hymn.name}"؟ سيتم حذف جميع شرائحها.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(false)}
        />
      )}
    </div>
  );
}
