import { useEffect, useState, useCallback, useRef, memo, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useCreateResource } from "@/components/base/useCreateResource";
import { usePGlite } from "@electric-sql/pglite-react";
import { FiBook, FiMusic, FiPlus, FiChevronRight, FiChevronLeft, FiUser, FiUpload } from "react-icons/fi";
import type { components } from "@/db/models";
import { getHymnsPaged } from "@/db/crud/read/hymn";
import { getBooksPaged } from "@/db/crud/read/liturgy";
import { search_hymn, search_book } from "@/db/utils/search";
import { import_tables_from_zip } from "@/db/utils/import";
import { toast } from "react-toastify";
import SearchInput from "@/components/base/SearchInput";

type Hymn = components["schemas"]["Hymn"];
type Book = components["schemas"]["Book"];

const PAGE_SIZE = 18;

const Pagination = memo(function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="join" dir="ltr">
      <button className="join-item btn btn-sm" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="الصفحة السابقة">
        <FiChevronLeft className="w-4 h-4" />
      </button>
      <button className="join-item btn btn-sm pointer-events-none" tabIndex={-1}>
        {page} / {totalPages}
      </button>
      <button className="join-item btn btn-sm" disabled={page === totalPages} onClick={() => onChange(page + 1)} aria-label="الصفحة التالية">
        <FiChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
});

type HymnListProps = {
  hymns: Hymn[];
  loading: boolean;
  query: string;
};

const HymnList = memo(function HymnList({ hymns, loading, query }: HymnListProps) {
  const { openHymn, createModals } = useCreateResource();

  if (loading && hymns.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }
  if (!loading && hymns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-base-content/50" dir="rtl">
        <FiMusic className="w-12 h-12 mb-4 opacity-30" />
        <p className="mb-4">{query ? "لا توجد نتائج مطابقة" : "لا توجد ترانيم بعد"}</p>
        {!query && (
          <button className="btn btn-primary btn-sm gap-2" onClick={openHymn}>
            <FiPlus className="w-4 h-4" />
            إنشاء ترنيمة
          </button>
        )}
        {createModals}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
      {hymns.map((hymn) => (
        <Link key={hymn.id} to={`/hymn/${hymn.id}`} className="card bg-base-200 shadow hover:shadow-md hover:bg-base-300 cursor-pointer transition-all">
          <div className="card-body gap-1 p-4">
            <div className="flex items-start gap-2">
              <FiMusic aria-hidden className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <h3 className="font-semibold text-base leading-snug">{hymn.name}</h3>
            </div>
            <p className="text-sm text-base-content/60 pr-6 flex items-center gap-1">
              <FiUser aria-hidden className="w-3 h-3 shrink-0" />
              {hymn.author ?? "غير محدد"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
});

type BookListProps = {
  books: Book[];
  loading: boolean;
  query: string;
};

const BookList = memo(function BookList({ books, loading, query }: BookListProps) {
  const { openBook, createModals } = useCreateResource();

  if (loading && books.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }
  if (!loading && books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-base-content/50" dir="rtl">
        <FiBook className="w-12 h-12 mb-4 opacity-30" />
        <p className="mb-4">{query ? "لا توجد نتائج مطابقة" : "لا توجد كتب بعد"}</p>
        {!query && (
          <button className="btn btn-primary btn-sm gap-2" onClick={openBook}>
            <FiPlus className="w-4 h-4" />
            إنشاء كتاب
          </button>
        )}
        {createModals}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
      {books.map((book) => (
        <Link key={book.id} to={`/book/${book.id}`} className="card bg-base-200 shadow hover:shadow-md hover:bg-base-300 cursor-pointer transition-all">
          <div className="card-body gap-1 p-4">
            <div className="flex items-start gap-2">
              <FiBook aria-hidden className="w-4 h-4 mt-0.5 text-secondary shrink-0" />
              <h3 className="font-semibold text-base leading-snug">{book.name}</h3>
            </div>
            {book.author && <p className="text-sm text-base-content/60 pr-6">{book.author}</p>}
            {book.description && <p className="text-xs text-base-content/40 pr-6 line-clamp-2">{book.description}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
});

export default function BrowsePage() {
  const db = usePGlite();
  const [activeTab, setActiveTab] = useState<"hymns" | "books">("hymns");

  // Import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // Hymns state
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [hymnTotal, setHymnTotal] = useState(0);
  const [hymnPage, setHymnPage] = useState(1);
  const [hymnLoading, setHymnLoading] = useState(true);
  const [hymnQuery, setHymnQuery] = useState("");

  // Books state
  const [books, setBooks] = useState<Book[]>([]);
  const [bookTotal, setBookTotal] = useState(0);
  const [bookPage, setBookPage] = useState(1);
  const [bookLoading, setBookLoading] = useState(true);
  const [bookQuery, setBookQuery] = useState("");

  const hymnTotalPages = Math.max(1, Math.ceil(hymnTotal / PAGE_SIZE));
  const bookTotalPages = Math.max(1, Math.ceil(bookTotal / PAGE_SIZE));

  const loadHymns = useCallback(
    async (page: number, query: string) => {
      if (!db) return;
      setHymnLoading(true);
      try {
        if (query) {
          const rows = await search_hymn(db, query);
          setHymns(rows);
          setHymnTotal(rows.length);
        } else {
          const result = await getHymnsPaged(db, page, PAGE_SIZE);
          setHymns(result.items);
          setHymnTotal(result.total);
        }
      } finally {
        setHymnLoading(false);
      }
    },
    [db],
  );

  const loadBooks = useCallback(
    async (page: number, query: string) => {
      if (!db) return;
      setBookLoading(true);
      try {
        if (query) {
          const rows = await search_book(db, query);
          setBooks(rows);
          setBookTotal(rows.length);
        } else {
          const result = await getBooksPaged(db, page, PAGE_SIZE);
          setBooks(result.items);
          setBookTotal(result.total);
        }
      } finally {
        setBookLoading(false);
      }
    },
    [db],
  );

  useEffect(() => {
    loadHymns(1, "");
    loadBooks(1, "");
  }, [loadHymns, loadBooks]);

  const handleHymnSearch = useCallback(
    (query: string) => {
      setHymnQuery(query);
      setHymnPage(1);
      loadHymns(1, query);
    },
    [loadHymns],
  );

  const handleBookSearch = useCallback(
    (query: string) => {
      setBookQuery(query);
      setBookPage(1);
      loadBooks(1, query);
    },
    [loadBooks],
  );

  const handleHymnPageChange = useCallback(
    (page: number) => {
      setHymnPage(page);
      loadHymns(page, hymnQuery);
    },
    [loadHymns, hymnQuery],
  );

  const handleBookPageChange = useCallback(
    (page: number) => {
      setBookPage(page);
      loadBooks(page, bookQuery);
    },
    [loadBooks, bookQuery],
  );

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file || !db) return;
    setImporting(true);
    try {
      await import_tables_from_zip(db, file, false);
      // Refresh both lists so newly imported resources show up.
      await Promise.all([loadHymns(hymnPage, hymnQuery), loadBooks(bookPage, bookQuery)]);
      toast.success("تم رفع المحتوى بنجاح");
    } catch (err) {
      console.error("Import failed:", err);
      toast.error("تعذّر رفع الملف. تأكد من أنه ملف صالح.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold">تصفح المحتوى</h1>
        <button
          type="button"
          className="btn btn-primary btn-sm gap-2"
          title="رفع محتوى من ملف"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? <span className="loading loading-spinner loading-xs" /> : <FiUpload className="w-4 h-4" />}
          رفع
        </button>
        <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleImportFile} />
      </div>

      <div role="tablist" className="tabs tabs-bordered">
        <button role="tab" className={`tab gap-2${activeTab === "hymns" ? " tab-active" : ""}`} onClick={() => setActiveTab("hymns")}>
          <FiMusic className="w-4 h-4" />
          الترانيم
          {!hymnLoading && <span className="badge badge-sm">{hymnTotal}</span>}
        </button>
        <button role="tab" className={`tab gap-2${activeTab === "books" ? " tab-active" : ""}`} onClick={() => setActiveTab("books")}>
          <FiBook className="w-4 h-4" />
          الكتب
          {!bookLoading && <span className="badge badge-sm">{bookTotal}</span>}
        </button>
      </div>

      {activeTab === "hymns" && (
        <div className="flex flex-col gap-4 h-[80vh]">
          <SearchInput onSearch={handleHymnSearch} placeholder="ابحث في الترانيم..." className="w-full" />
          <div className="flex-1 min-h-0 overflow-y-auto">
            <HymnList hymns={hymns} loading={hymnLoading} query={hymnQuery} />
          </div>
          {!hymnQuery && (
            <div className="flex justify-center pt-2">
              <Pagination page={hymnPage} totalPages={hymnTotalPages} onChange={handleHymnPageChange} />
            </div>
          )}
        </div>
      )}
      {activeTab === "books" && (
        <div className="flex flex-col gap-4 h-[80vh]">
          <SearchInput onSearch={handleBookSearch} placeholder="ابحث في الكتب ..." className="w-full" />
          <div className="flex-1 min-h-0 overflow-y-auto">
            <BookList books={books} loading={bookLoading} query={bookQuery} />
          </div>
          {!bookQuery && (
            <div className="flex justify-center pt-2">
              <Pagination page={bookPage} totalPages={bookTotalPages} onChange={handleBookPageChange} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
