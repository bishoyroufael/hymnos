import { useState } from "react";
import { usePGlite } from "@electric-sql/pglite-react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiLayers } from "react-icons/fi";
import BookInfoCard from "@/components/liturgy/BookInfoCard";
import SectionCard, { type SectionForm } from "@/components/liturgy/SectionCard";
import type { SubsectionForm } from "@/components/liturgy/SubsectionCard";
import { uuidv7 } from "uuidv7";
import { toast } from "react-toastify";
import { createBook } from "@/db/crud/create/liturgy";

export default function LiturgyCreatePage() {
  const db = usePGlite();
  const navigate = useNavigate();

  const [bookName, setBookName] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [isbn, setIsbn] = useState("");

  const [chapters, setChapters] = useState<SectionForm[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const addChapter = () => {
    const maxPos = chapters.length > 0 ? Math.max(...chapters.map((c) => c.position)) : 0;
    setChapters([
      ...chapters,
      {
        id: uuidv7(),
        name: "",
        description: "",
        position: maxPos + 1,
        subsections: [],
        isExpanded: true,
      },
    ]);
  };

  const removeChapter = (id: string) => setChapters(chapters.filter((c) => c.id !== id));

  const updateChapter = (id: string, updates: Partial<SectionForm>) => setChapters(chapters.map((c) => (c.id === id ? { ...c, ...updates } : c)));

  const toggleChapter = (id: string) => setChapters(chapters.map((c) => (c.id === id ? { ...c, isExpanded: !c.isExpanded } : c)));

  const addSubsection = (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return;
    updateChapter(chapterId, {
      subsections: [...chapter.subsections, { id: uuidv7(), name: "", description: "", rubric: "" }],
    });
  };

  const removeSubsection = (chapterId: string, subsectionId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return;
    updateChapter(chapterId, {
      subsections: chapter.subsections.filter((s) => s.id !== subsectionId),
    });
  };

  const updateSubsection = (chapterId: string, subsectionId: string, updates: Partial<SubsectionForm>) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return;
    updateChapter(chapterId, {
      subsections: chapter.subsections.map((s) => (s.id === subsectionId ? { ...s, ...updates } : s)),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!bookName.trim()) {
      toast.warning("الرجاء إدخال اسم الكتاب");
      return;
    }
    if (chapters.length === 0) {
      toast.warning("الرجاء إضافة فصل واحد على الأقل");
      return;
    }
    for (const chapter of chapters) {
      if (!chapter.name.trim()) {
        toast.warning("الرجاء إدخال اسم لكل فصل");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const bookId = await createBook(db, {
        name: bookName.trim(),
        author: bookAuthor.trim() || undefined,
        description: bookDescription.trim() || undefined,
        isbn: isbn.trim() || undefined,
        chapters: chapters.map((chapter) => ({
          id: chapter.id,
          name: chapter.name.trim(),
          description: chapter.description.trim() || undefined,
          sections: chapter.subsections.map((s) => ({
            id: s.id,
            name: s.name.trim(),
            description: s.description.trim() || undefined,
            rubric: s.rubric.trim() || undefined,
          })),
        })),
      });

      toast.success("تم إنشاء الكتاب");
      navigate(`/book/${bookId}`);
    } catch (err) {
      console.error("Error creating book:", err);
      toast.error("حدث خطأ أثناء إنشاء الكتاب");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-3xl lg:text-4xl font-bold">إنشاء كتاب جديد</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <BookInfoCard
          bookName={bookName}
          setBookName={setBookName}
          bookAuthor={bookAuthor}
          setBookAuthor={setBookAuthor}
          bookDescription={bookDescription}
          setBookDescription={setBookDescription}
          isbn={isbn}
          setIsbn={setIsbn}
        />

        <div className="collapse collapse-arrow bg-base-200 shadow-lg">
          <input type="checkbox" defaultChecked />
          <div className="collapse-title">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiLayers className="w-5 h-5" />
                الفصول
              </h2>
              <button
                type="button"
                className="btn btn-primary btn-sm gap-2 z-50"
                onClick={(e) => {
                  e.stopPropagation();
                  addChapter();
                }}
              >
                <FiPlus className="w-4 h-4" />
                إضافة فصل
              </button>
            </div>
          </div>
          <div className="collapse-content">
            <div className="flex flex-col gap-4 pt-2">
              {chapters.length === 0 ? (
                <p className="text-base-content/50 text-sm text-center py-4">لا توجد فصول. أضف فصلاً للبدء.</p>
              ) : (
                chapters.map((chapter) => (
                  <SectionCard
                    key={chapter.id}
                    section={chapter}
                    onUpdate={updateChapter}
                    onRemove={removeChapter}
                    onToggle={toggleChapter}
                    onAddSubsection={addSubsection}
                    onUpdateSubsection={updateSubsection}
                    onRemoveSubsection={removeSubsection}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex gap-4 justify-end">
              <button type="button" className="btn btn-ghost" onClick={() => window.history.back()} disabled={isSubmitting}>
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting && <span className="loading loading-spinner loading-sm" />}
                إنشاء الكتاب
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* <div className="text-xs text-base-content/50">
        <p>Database: {db ? "✅ Connected" : "❌ Not Connected"}</p>
        <p>
          Chapters: {chapters.length} | Sections: {chapters.reduce((a, c) => a + c.subsections.length, 0)}
        </p>
      </div> */}
    </div>
  );
}
