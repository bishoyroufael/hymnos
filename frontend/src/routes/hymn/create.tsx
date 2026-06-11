import { useState } from "react";
import { usePGlite } from "@electric-sql/pglite-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createHymn } from "@/db/crud/create/hymn";

export default function HymnCreatePage() {
  const db = usePGlite();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [author, setAuthor] = useState("");
  const [composer, setComposer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (!name.trim()) {
      toast.warning("الرجاء إدخال اسم الترنيمة");
      return;
    }

    setIsSubmitting(true);
    try {
      const hymnId = await createHymn(db, {
        name: name.trim(),
        author: author.trim() || null,
        composer: composer.trim() || null,
      });
      toast.success("تم إنشاء الترنيمة");
      navigate(`/hymn/${hymnId}`);
    } catch (err) {
      console.error("Error creating hymn:", err);
      toast.error("حدث خطأ أثناء إنشاء الترنيمة");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 max-w-2xl mx-auto" dir="rtl">
      <h1 className="text-3xl lg:text-4xl font-bold">إنشاء ترنيمة جديدة</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body gap-4">
            <h2 className="card-title">معلومات الترنيمة</h2>

            <div className="flex flex-col gap-2">
              <label className="label" htmlFor="hymn-name">
                <span className="label-text">اسم الترنيمة *</span>
              </label>
              <input
                id="hymn-name"
                name="name"
                type="text"
                className="input input-bordered w-full"
                placeholder="مثال: صلاة البحر"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label" htmlFor="hymn-author">
                <span className="label-text">المؤلف</span>
              </label>
              <input
                id="hymn-author"
                name="author"
                type="text"
                className="input input-bordered w-full"
                placeholder="اسم المؤلف (اختياري)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label" htmlFor="hymn-composer">
                <span className="label-text">الملحن</span>
              </label>
              <input
                id="hymn-composer"
                name="composer"
                type="text"
                className="input input-bordered w-full"
                placeholder="اسم الملحن (اختياري)"
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
              />
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
                إنشاء الترنيمة
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
