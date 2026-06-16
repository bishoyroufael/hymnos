import { useState } from "react";
import { usePGlite } from "@electric-sql/pglite-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import EditModal from "./EditModal";
import { createBook } from "@/db/crud/create/liturgy";
import { createHymn } from "@/db/crud/create/hymn";

const BOOK_FIELDS = [
  { key: "name", label: "اسم الكتاب", required: true, placeholder: "اسم الكتاب" },
  { key: "author", label: "المؤلف", placeholder: "اسم المؤلف" },
  { key: "description", label: "الوصف", multiline: true, placeholder: "وصف الكتاب" },
  { key: "isbn", label: "رقم ISBN", placeholder: "978-XXXXXXXXXX" },
];

const HYMN_FIELDS = [
  { key: "name", label: "اسم الترنيمة", required: true, placeholder: "اسم الترنيمة" },
  { key: "author", label: "المؤلف", placeholder: "اسم المؤلف" },
  { key: "composer", label: "الملحن", placeholder: "اسم الملحن" },
];

/**
 * Create a book or hymn from a modal (no dedicated create page): the modal collects only
 * metadata, then navigates to the resource's /[uuid] page where the rest is edited. For a
 * book that means an empty book whose nodes are added in the editor.
 *
 * Returns openers + the modal JSX to render somewhere in the component.
 */
export function useCreateResource() {
  const db = usePGlite();
  const navigate = useNavigate();
  const [open, setOpen] = useState<null | "book" | "hymn">(null);

  const onCreateBook = async (v: Record<string, string>) => {
    const id = await createBook(db, {
      name: v.name.trim(),
      author: v.author.trim() || undefined,
      description: v.description.trim() || undefined,
      isbn: v.isbn.trim() || undefined,
      nodes: [],
    });
    toast.success("تم إنشاء الكتاب");
    navigate(`/book/${id}`);
  };

  const onCreateHymn = async (v: Record<string, string>) => {
    const id = await createHymn(db, {
      name: v.name.trim(),
      author: v.author.trim() || null,
      composer: v.composer.trim() || null,
    });
    toast.success("تم إنشاء الترنيمة");
    navigate(`/hymn/${id}`);
  };

  const createModals = (
    <>
      {open === "book" && (
        <EditModal title="كتاب جديد" saveLabel="إنشاء" fields={BOOK_FIELDS} initial={{ name: "", author: "", description: "", isbn: "" }} onSave={onCreateBook} onClose={() => setOpen(null)} />
      )}
      {open === "hymn" && (
        <EditModal title="ترنيمة جديدة" saveLabel="إنشاء" fields={HYMN_FIELDS} initial={{ name: "", author: "", composer: "" }} onSave={onCreateHymn} onClose={() => setOpen(null)} />
      )}
    </>
  );

  return { openBook: () => setOpen("book"), openHymn: () => setOpen("hymn"), createModals };
}
