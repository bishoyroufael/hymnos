import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePGlite } from "@electric-sql/pglite-react";
import { FiBook, FiChevronDown, FiChevronLeft, FiDownload, FiEdit2, FiHash, FiLayers, FiPlay, FiPlus, FiSave, FiTrash2, FiUser, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import type { components } from "@/db/models";
import { getBook } from "@/db/crud/read/liturgy";
import { updateBook, updateBookChapter, updateBookSection } from "@/db/crud/update/liturgy";
import { deleteBook, deleteBookChapter, deleteBookSection } from "@/db/crud/delete/liturgy";
import { createBookChapter, createBookSection } from "@/db/crud/create/liturgy";
import { exportResourceAsZip, downloadBlob } from "@/db/utils/export";

type BookView = components["schemas"]["BookView"];
type BookChapter = NonNullable<BookView["chapters"]>[number];
type BookSection = NonNullable<BookChapter["sections"]>[number];

// ─── helpers ────────────────────────────────────────────────────────────────

function nextPos(items: { position: number }[]) {
  return items.length === 0 ? 1 : Math.max(...items.map((i) => i.position)) + 1;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function InlineField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-base-content/50">{label}</span>
      {multiline ? (
        <textarea
          className="textarea textarea-bordered textarea-sm h-16 w-full"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input className="input input-bordered input-sm w-full" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function SaveCancel({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex gap-2 mt-2">
      <button type="button" className="btn btn-primary btn-sm gap-1" onClick={onSave} disabled={saving}>
        {saving ? <span className="loading loading-spinner loading-xs" /> : <FiSave className="w-3 h-3" />}
        حفظ
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={saving}>
        <FiX className="w-3 h-3" />
        إلغاء
      </button>
    </div>
  );
}

// ─── delete modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  id,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  id: string;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} id={id} className="modal" onClose={onCancel}>
      <div className="modal-box" dir="rtl">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4 text-base-content/70">{message}</p>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            إلغاء
          </button>
          <button type="button" className="btn btn-error" onClick={onConfirm}>
            حذف
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function BookPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const db = usePGlite();
  const navigate = useNavigate();

  // ── data state ──
  const [book, setBook] = useState<BookView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ── UI state ──
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // editing book metadata
  const [editingBook, setEditingBook] = useState(false);
  const [bookEdit, setBookEdit] = useState({ name: "", author: "", description: "", isbn: "" });

  // editing a chapter
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterEdit, setChapterEdit] = useState({ name: "", description: "" });

  // adding a new chapter
  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapter, setNewChapter] = useState({ name: "", description: "" });

  // editing a section
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionEdit, setSectionEdit] = useState({ name: "", description: "", rubric: "" });

  // adding a new section
  const [addingSectionToChapter, setAddingSectionToChapter] = useState<string | null>(null);
  const [newSection, setNewSection] = useState({ name: "", description: "", rubric: "" });

  // delete confirmations
  const [deleteBookModal, setDeleteBookModal] = useState(false);
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);

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

  // ── load ──
  const reload = async () => {
    if (!db || !uuid) return;
    const result = await getBook(db, uuid);
    if (result) {
      setBook(result);
      setExpandedChapters((prev) => {
        const next = new Set(prev);
        result.chapters.forEach((c) => next.add(c.chapter_id));
        return next;
      });
    }
  };

  useEffect(() => {
    if (!db || !uuid) return;
    setLoading(true);
    getBook(db, uuid)
      .then((result) => {
        if (!result) {
          setError("لم يتم العثور على الكتاب");
        } else {
          setBook(result);
          setExpandedChapters(new Set(result.chapters.map((c) => c.chapter_id)));
        }
      })
      .catch(() => setError("حدث خطأ أثناء تحميل الكتاب"))
      .finally(() => setLoading(false));
  }, [db, uuid]);

  // ── book metadata CRUD ──
  const startEditBook = () => {
    if (!book) return;
    setBookEdit({ name: book.name, author: book.author ?? "", description: book.description ?? "", isbn: book.isbn ?? "" });
    setEditingBook(true);
  };

  const saveBookEdit = async () => {
    if (!db || !uuid || !bookEdit.name.trim()) return;
    setSaving(true);
    try {
      await updateBook(db, uuid, {
        name: bookEdit.name.trim(),
        author: bookEdit.author.trim() || null,
        description: bookEdit.description.trim() || null,
        isbn: bookEdit.isbn.trim() || null,
      });
      setEditingBook(false);
      await reload();
      toast.success("تم حفظ الكتاب");
    } catch (e) {
      console.error("Failed to save book:", e);
      toast.error("تعذّر حفظ الكتاب");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteBook = async () => {
    if (!db || !uuid || !book) return;
    setSaving(true);
    try {
      await deleteBook(db, uuid, book.chapters);
      toast.success("تم حذف الكتاب");
      navigate(-1);
    } catch (e) {
      console.error("Failed to delete book:", e);
      toast.error("تعذّر حذف الكتاب");
      setSaving(false);
    }
  };

  // ── chapter CRUD ──
  const startEditChapter = (chapter: BookChapter) => {
    setEditingChapterId(chapter.chapter_id);
    setChapterEdit({ name: chapter.name, description: chapter.description ?? "" });
    setEditingSectionId(null);
  };

  const saveChapterEdit = async () => {
    if (!db || !editingChapterId || !chapterEdit.name.trim()) return;
    setSaving(true);
    try {
      await updateBookChapter(db, editingChapterId, {
        name: chapterEdit.name.trim(),
        description: chapterEdit.description.trim() || null,
      });
      setEditingChapterId(null);
      await reload();
      toast.success("تم حفظ الفصل");
    } catch (e) {
      console.error("Failed to save chapter:", e);
      toast.error("تعذّر حفظ الفصل");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteChapter = async () => {
    if (!db || !deleteChapterId || !book) return;
    const chapter = book.chapters.find((c) => c.chapter_id === deleteChapterId);
    if (!chapter) return;
    setSaving(true);
    try {
      await deleteBookChapter(db, chapter);
      setDeleteChapterId(null);
      await reload();
      toast.success("تم حذف الفصل");
    } catch (e) {
      console.error("Failed to delete chapter:", e);
      toast.error("تعذّر حذف الفصل");
    } finally {
      setSaving(false);
    }
  };

  const saveNewChapter = async () => {
    if (!db || !uuid || !newChapter.name.trim() || !book) return;
    setSaving(true);
    try {
      const position = nextPos(book.chapters);
      await createBookChapter(
        db,
        uuid,
        {
          name: newChapter.name.trim(),
          description: newChapter.description.trim() || null,
        },
        position,
      );
      setAddingChapter(false);
      setNewChapter({ name: "", description: "" });
      await reload();
      toast.success("تمت إضافة الفصل");
    } catch (e) {
      console.error("Failed to add chapter:", e);
      toast.error("تعذّر إضافة الفصل");
    } finally {
      setSaving(false);
    }
  };

  // ── section CRUD ──
  const startEditSection = (section: BookSection) => {
    setEditingSectionId(section.section_id);
    setSectionEdit({ name: section.name, description: section.description ?? "", rubric: section.rubric ?? "" });
    setEditingChapterId(null);
  };

  const saveSectionEdit = async () => {
    if (!db || !editingSectionId || !sectionEdit.name.trim()) return;
    setSaving(true);
    try {
      await updateBookSection(db, editingSectionId, {
        name: sectionEdit.name.trim(),
        description: sectionEdit.description.trim() || null,
        rubric: sectionEdit.rubric.trim() || null,
      });
      setEditingSectionId(null);
      await reload();
      toast.success("تم حفظ القسم");
    } catch (e) {
      console.error("Failed to save section:", e);
      toast.error("تعذّر حفظ القسم");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteSection = async () => {
    if (!db || !deleteSectionId) return;
    setSaving(true);
    try {
      await deleteBookSection(db, deleteSectionId);
      setDeleteSectionId(null);
      await reload();
      toast.success("تم حذف القسم");
    } catch (e) {
      console.error("Failed to delete section:", e);
      toast.error("تعذّر حذف القسم");
    } finally {
      setSaving(false);
    }
  };

  const saveNewSection = async (chapterId: string) => {
    if (!db || !newSection.name.trim() || !book) return;
    const chapter = book.chapters.find((c) => c.chapter_id === chapterId);
    if (!chapter) return;
    setSaving(true);
    try {
      const position = nextPos(chapter.sections);
      await createBookSection(
        db,
        chapterId,
        {
          name: newSection.name.trim(),
          description: newSection.description.trim() || null,
          rubric: newSection.rubric.trim() || null,
        },
        position,
      );
      setAddingSectionToChapter(null);
      setNewSection({ name: "", description: "", rubric: "" });
      await reload();
      toast.success("تمت إضافة القسم");
    } catch (e) {
      console.error("Failed to add section:", e);
      toast.error("تعذّر إضافة القسم");
    } finally {
      setSaving(false);
    }
  };

  // ── UI helpers ──
  const toggleChapter = (id: string) =>
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── render states ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error || !book) {
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

  // ── main render ──
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 max-w-4xl mx-auto" dir="rtl">
      {/* ── Book Header ── */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body gap-3">
          {editingBook ? (
            <>
              <InlineField
                label="اسم الكتاب *"
                value={bookEdit.name}
                onChange={(v) => setBookEdit((p) => ({ ...p, name: v }))}
                placeholder="اسم الكتاب"
              />
              <InlineField
                label="المؤلف"
                value={bookEdit.author}
                onChange={(v) => setBookEdit((p) => ({ ...p, author: v }))}
                placeholder="اسم المؤلف"
              />
              <InlineField
                label="الوصف"
                value={bookEdit.description}
                onChange={(v) => setBookEdit((p) => ({ ...p, description: v }))}
                multiline
                placeholder="وصف الكتاب"
              />
              <InlineField
                label="رقم ISBN"
                value={bookEdit.isbn}
                onChange={(v) => setBookEdit((p) => ({ ...p, isbn: v }))}
                placeholder="978-XXXXXXXXXX"
              />
              <SaveCancel onSave={saveBookEdit} onCancel={() => setEditingBook(false)} saving={saving} />
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FiBook className="w-8 h-8 mt-1 text-primary shrink-0" />
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold">{book.name}</h1>
                    {book.author && (
                      <p className="flex items-center gap-1 text-base-content/70">
                        <FiUser className="w-4 h-4" />
                        {book.author}
                      </p>
                    )}
                    {book.isbn && (
                      <p className="flex items-center gap-1 text-base-content/50 text-sm">
                        <FiHash className="w-3 h-3" />
                        ISBN: {book.isbn}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" className="btn btn-ghost btn-sm btn-square" title="تحميل الكتاب" onClick={handleExport} disabled={exporting}>
                    {exporting ? <span className="loading loading-spinner loading-xs" /> : <FiDownload className="w-4 h-4" />}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm btn-square" title="تعديل الكتاب" onClick={startEditBook}>
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-square text-error"
                    title="حذف الكتاب"
                    onClick={() => setDeleteBookModal(true)}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {book.description && <p className="text-base-content/70 text-sm leading-relaxed">{book.description}</p>}
              <div className="flex items-center gap-4 text-xs text-base-content/50 pt-1">
                <span>{book.chapters.length} فصل</span>
                <span>{book.chapters.reduce((a, c) => a + c.sections.length, 0)} قسم</span>
                <span>{book.chapters.reduce((a, c) => a + c.sections.reduce((b, s) => b + s.slide_count, 0), 0)} شريحة</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Chapters ── */}
      <div className="flex flex-col gap-3">
        {book.chapters.length === 0 && !addingChapter && <p className="text-center text-base-content/50 py-6">لا توجد فصول في هذا الكتاب</p>}

        {book.chapters.map((chapter) => {
          const isExpanded = expandedChapters.has(chapter.chapter_id);
          const isEditingThisChapter = editingChapterId === chapter.chapter_id;
          const isAddingSectionHere = addingSectionToChapter === chapter.chapter_id;

          return (
            <div key={chapter.chapter_id} className="card bg-base-200 shadow">
              {/* Chapter header */}
              <div className="card-body py-3 px-4">
                {isEditingThisChapter ? (
                  <>
                    <InlineField
                      label="اسم الفصل *"
                      value={chapterEdit.name}
                      onChange={(v) => setChapterEdit((p) => ({ ...p, name: v }))}
                      placeholder="اسم الفصل"
                    />
                    <InlineField
                      label="الوصف"
                      value={chapterEdit.description}
                      onChange={(v) => setChapterEdit((p) => ({ ...p, description: v }))}
                      placeholder="وصف الفصل"
                    />
                    <SaveCancel onSave={saveChapterEdit} onCancel={() => setEditingChapterId(null)} saving={saving} />
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <button type="button" className="flex items-center gap-2 flex-1 text-right" onClick={() => toggleChapter(chapter.chapter_id)}>
                      <FiLayers className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex flex-col items-start">
                        <span className="font-bold">{chapter.name}</span>
                        {chapter.description && <span className="text-xs text-base-content/50">{chapter.description}</span>}
                      </div>
                      <div className="flex items-center gap-3 mr-auto">
                        <span className="text-xs text-base-content/50 hidden sm:block">{chapter.sections.length} قسم</span>
                        {isExpanded ? (
                          <FiChevronDown className="w-4 h-4 text-base-content/50" />
                        ) : (
                          <FiChevronLeft className="w-4 h-4 text-base-content/50" />
                        )}
                      </div>
                    </button>
                    <div className="flex gap-1 shrink-0 mr-2">
                      <button type="button" className="btn btn-ghost btn-xs btn-square" title="تعديل" onClick={() => startEditChapter(chapter)}>
                        <FiEdit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-square text-error"
                        title="حذف"
                        onClick={() => setDeleteChapterId(chapter.chapter_id)}
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sections */}
              {isExpanded && (
                <div className="border-t border-base-300">
                  {chapter.sections.map((section) => {
                    const isEditingThisSection = editingSectionId === section.section_id;
                    return (
                      <div key={section.section_id} className="border-b border-base-300 last:border-b-0">
                        {isEditingThisSection ? (
                          <div className="px-4 py-3 flex flex-col gap-2">
                            <InlineField
                              label="اسم القسم *"
                              value={sectionEdit.name}
                              onChange={(v) => setSectionEdit((p) => ({ ...p, name: v }))}
                              placeholder="اسم القسم"
                            />
                            <InlineField
                              label="الوصف"
                              value={sectionEdit.description}
                              onChange={(v) => setSectionEdit((p) => ({ ...p, description: v }))}
                              placeholder="وصف القسم"
                            />
                            <InlineField
                              label="التعليمات الليتورجية (rubric)"
                              value={sectionEdit.rubric}
                              onChange={(v) => setSectionEdit((p) => ({ ...p, rubric: v }))}
                              placeholder="تعليمات (اختياري)"
                            />
                            <SaveCancel onSave={saveSectionEdit} onCancel={() => setEditingSectionId(null)} saving={saving} />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between px-4 py-3 hover:bg-base-300 transition-colors group">
                            <button
                              type="button"
                              className="flex flex-col items-start gap-0.5 flex-1 text-right"
                              onClick={() => navigate(`/presentation/${uuid}?startSlide=${section.section_id}`)}
                            >
                              <span className="font-medium text-sm">{section.name}</span>
                              {section.description && <span className="text-xs text-base-content/50">{section.description}</span>}
                              {section.rubric && <span className="text-xs text-secondary/70 italic">{section.rubric}</span>}
                            </button>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-base-content/50">{section.slide_count} شريحة</span>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 transition-opacity"
                                title="عرض"
                                onClick={() => navigate(`/presentation/${uuid}?startSlide=${section.section_id}`)}
                              >
                                <FiPlay className="w-3 h-3 text-primary" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 transition-opacity"
                                title="تعديل"
                                onClick={() => startEditSection(section)}
                              >
                                <FiEdit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs btn-square text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                title="حذف"
                                onClick={() => setDeleteSectionId(section.section_id)}
                              >
                                <FiTrash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add section form or button */}
                  {isAddingSectionHere ? (
                    <div className="px-4 py-3 flex flex-col gap-2 bg-base-100">
                      <InlineField
                        label="اسم القسم *"
                        value={newSection.name}
                        onChange={(v) => setNewSection((p) => ({ ...p, name: v }))}
                        placeholder="اسم القسم"
                      />
                      <InlineField
                        label="الوصف"
                        value={newSection.description}
                        onChange={(v) => setNewSection((p) => ({ ...p, description: v }))}
                        placeholder="وصف القسم (اختياري)"
                      />
                      <InlineField
                        label="التعليمات الليتورجية (rubric)"
                        value={newSection.rubric}
                        onChange={(v) => setNewSection((p) => ({ ...p, rubric: v }))}
                        placeholder="تعليمات (اختياري)"
                      />
                      <SaveCancel
                        onSave={() => saveNewSection(chapter.chapter_id)}
                        onCancel={() => {
                          setAddingSectionToChapter(null);
                          setNewSection({ name: "", description: "", rubric: "" });
                        }}
                        saving={saving}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-base-content/50 hover:text-base-content hover:bg-base-300 transition-colors"
                      onClick={() => {
                        setAddingSectionToChapter(chapter.chapter_id);
                        setEditingSectionId(null);
                        setEditingChapterId(null);
                      }}
                    >
                      <FiPlus className="w-3 h-3" />
                      إضافة قسم
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add chapter form or button */}
        {addingChapter ? (
          <div className="card bg-base-200 shadow">
            <div className="card-body gap-2">
              <h3 className="font-bold text-sm">فصل جديد</h3>
              <InlineField
                label="اسم الفصل *"
                value={newChapter.name}
                onChange={(v) => setNewChapter((p) => ({ ...p, name: v }))}
                placeholder="اسم الفصل"
              />
              <InlineField
                label="الوصف"
                value={newChapter.description}
                onChange={(v) => setNewChapter((p) => ({ ...p, description: v }))}
                placeholder="وصف الفصل (اختياري)"
              />
              <SaveCancel
                onSave={saveNewChapter}
                onCancel={() => {
                  setAddingChapter(false);
                  setNewChapter({ name: "", description: "" });
                }}
                saving={saving}
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-outline btn-sm gap-2 w-full border-dashed"
            onClick={() => {
              setAddingChapter(true);
              setEditingChapterId(null);
              setEditingBook(false);
            }}
          >
            <FiPlus className="w-4 h-4" />
            إضافة فصل
          </button>
        )}
      </div>

      {/* ── Delete modals ── */}
      {deleteBookModal && (
        <DeleteModal
          id="delete-book-modal"
          title="حذف الكتاب"
          message={`هل أنت متأكد من حذف "${book.name}"؟ سيتم حذف جميع الفصول والأقسام والشرائح المرتبطة به.`}
          onConfirm={confirmDeleteBook}
          onCancel={() => setDeleteBookModal(false)}
        />
      )}
      {deleteChapterId &&
        (() => {
          const chapter = book.chapters.find((c) => c.chapter_id === deleteChapterId);
          return (
            <DeleteModal
              id="delete-chapter-modal"
              title="حذف الفصل"
              message={`هل أنت متأكد من حذف "${chapter?.name ?? "هذا الفصل"}"؟ سيتم حذف جميع أقسامه وشرائحه.`}
              onConfirm={confirmDeleteChapter}
              onCancel={() => setDeleteChapterId(null)}
            />
          );
        })()}
      {deleteSectionId &&
        (() => {
          const section = book.chapters.flatMap((c) => c.sections).find((s) => s.section_id === deleteSectionId);
          return (
            <DeleteModal
              id="delete-section-modal"
              title="حذف القسم"
              message={`هل أنت متأكد من حذف "${section?.name ?? "هذا القسم"}"؟ سيتم حذف جميع شرائحه.`}
              onConfirm={confirmDeleteSection}
              onCancel={() => setDeleteSectionId(null)}
            />
          );
        })()}
    </div>
  );
}
