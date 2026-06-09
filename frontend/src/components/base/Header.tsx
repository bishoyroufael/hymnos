import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePGlite } from "@electric-sql/pglite-react";
import type { components } from "@db/models";
import { FiMenu, FiSettings } from "react-icons/fi";

type BibleBookView = components["schemas"]["BibleBookView"];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const db = usePGlite();
  const [bibleBooks, setBibleBooks] = useState<BibleBookView[]>([]);
  const [loading, setLoading] = useState(false);

  const isHomePage = location.pathname === "/";
  const isBiblePage = location.pathname.startsWith("/bible");

  // Load Bible books once on mount
  useEffect(() => {
    if (db && bibleBooks.length === 0) {
      loadBibleBooks();
    }
  }, [db]);

  const loadBibleBooks = async () => {
    if (!db) return;

    setLoading(true);
    try {
      // Get default Bible ID
      const bibleResult = await db.query<{ id: string }>(`
        SELECT b.id
        FROM bible b
        JOIN bible_translation bt ON b.translation_id = bt.id
        WHERE bt.is_default = true
        LIMIT 1
      `);

      if (bibleResult.rows.length === 0) {
        setLoading(false);
        return;
      }

      const bibleId = bibleResult.rows[0].id;

      // Get all Bible book IDs for this Bible
      const bookIdsResult = await db.query<{ id: string }>(
        `
        SELECT id
        FROM bible_book
        WHERE bible_id = $1
        ORDER BY canon_order
      `,
        [bibleId],
      );

      if (bookIdsResult.rows.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch Bible book views using the view
      const bookViews: BibleBookView[] = [];
      for (const row of bookIdsResult.rows) {
        const viewResult = await db.query<{ bible_book: BibleBookView }>(
          `
          SELECT bible_book
          FROM view_bible_book_json
          WHERE id = $1
        `,
          [row.id],
        );

        if (viewResult.rows.length > 0) {
          bookViews.push(viewResult.rows[0].bible_book);
        }
      }

      setBibleBooks(bookViews);
    } catch (error) {
      console.error("Failed to load Bible books:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterClick = (chapterId: string) => {
    navigate(`/presentation/${chapterId}`);
    // Close the drawer on mobile after navigation
    const drawerCheckbox = document.getElementById("nav-drawer") as HTMLInputElement;
    if (drawerCheckbox) {
      drawerCheckbox.checked = false;
    }
  };

  const renderNavigationMenu = () => (
    <>
      <li>
        <Link to="/" className={isHomePage ? "text-base-content font-medium" : "text-base-content/40 hover:text-base-content"}>
          الرئيسية
        </Link>
      </li>

      <li>
        <Link
          to="/browse"
          className={`flex items-center gap-1 ${location.pathname.startsWith("/browse") ? "text-base-content font-medium" : "text-base-content/40 hover:text-base-content"}`}
        >
          تصفح
        </Link>
      </li>
      <li>
        <details
          onBlur={(e) => {
            // Close if focus leaves the details element entirely
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              e.currentTarget.removeAttribute("open");
            }
          }}
        >
          <summary className={isBiblePage ? "text-base-content font-medium" : "text-base-content/40 hover:text-base-content"}>الكتاب المقدس</summary>
          <ul className="m-4 w-64 no-scrollbar lg:w-80 max-h-96 overflow-y-auto bg-base-200 rounded-box shadow-lg z-50">
            {loading ? (
              <li className="text-center py-4">
                <span className="loading loading-spinner loading-sm"></span>
              </li>
            ) : bibleBooks.length === 0 ? (
              <li className="text-center py-4">
                <span className="text-base-content/60">لا توجد كتب متاحة</span>
              </li>
            ) : (
              <>
                <h2 className="menu-title text-wrap">{bibleBooks[0].bible.translation?.name}</h2>
                {bibleBooks.map((book) => (
                  <li key={book.id}>
                    <details>
                      <summary>{book.name_lang}</summary>
                      <ul className="grid grid-cols-6 gap-1 p-2">
                        {book.chapters.map((chapter) => (
                          <li className="items-center" key={chapter.id}>
                            <a onClick={() => handleChapterClick(chapter.id!)} className="text-center">
                              {chapter.number}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </>
            )}
          </ul>
        </details>
      </li>
    </>
  );

  return (
    <header className="w-full border-base-300 bg-base-100 border-b">
      <input id="nav-drawer" type="checkbox" className="drawer-toggle" />

      <div className="w-11/12 lg:w-10/12 mx-auto">
        {/* Navbar */}
        <div className="navbar bg-base-100 px-4 flex justify-between">
          {/* Mobile Menu Button */}
          <div className="flex-none lg:hidden w-1/3">
            <label htmlFor="nav-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
              <FiMenu className="w-4 h-4" />
            </label>
          </div>
          {/* Desktop Navigation Menu (Hidden on mobile) */}
          <div className="hidden lg:flex w-1/3">
            <ul className="menu menu-horizontal bg-base-100 rounded-box">{renderNavigationMenu()}</ul>
          </div>
          {/* Logo/Title - Center */}
          <div className="flex gap-2 items-center flex-1 justify-center">
            <h1 className="text-sm lg:text-lg font-bold text-shadow-lg">ϩⲩⲙⲛⲟⲥ</h1>
          </div>
          {/* Settings Button */}
          <div
            className="text-left w-1/3"
            // @ts-ignore
            onClick={() => document.getElementById("settings_modal")?.showModal()}
          >
            <button className="btn btn-ghost btn-sm" aria-label="Settings">
              <FiSettings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Sidebar */}
      <div className="drawer-side lg:hidden z-50">
        <label htmlFor="nav-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <ul className="menu bg-base-200 min-h-full w-80 max-w-80 p-4">
          {/* Sidebar Title */}
          <li className="menu-title">
            <h2 className="text-lg font-bold">القائمة</h2>
          </li>
          {renderNavigationMenu()}
        </ul>
      </div>
    </header>
  );
}
