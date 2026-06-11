import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePGlite } from "@electric-sql/pglite-react";
import type { components } from "@db/models";
import { FiMenu, FiSettings } from "react-icons/fi";

type BibleBookView = components["schemas"]["BibleBookView"];

export default function Header() {
  const location = useLocation();
  const db = usePGlite();
  const [bibleBooks, setBibleBooks] = useState<BibleBookView[]>([]);
  const [loading, setLoading] = useState(true);

  const isHomePage = location.pathname === "/";
  const isBiblePage = location.pathname.startsWith("/bible");

  // Load Bible books once on mount — a single query instead of one per book,
  // which matters on mobile where PGlite round-trips are not free.
  useEffect(() => {
    if (!db) return;
    let cancelled = false;

    db.query<{ bible_book: BibleBookView }>(
      `
      SELECT v.bible_book
      FROM view_bible_book_json v
      JOIN bible_book bb ON bb.id = v.id
      JOIN bible b ON b.id = bb.bible_id
      JOIN bible_translation bt ON bt.id = b.translation_id
      WHERE bt.is_default = true
      ORDER BY bb.canon_order
    `,
    )
      .then((result) => {
        if (!cancelled) setBibleBooks(result.rows.map((row) => row.bible_book));
      })
      .catch((error) => console.error("Failed to load Bible books:", error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [db]);

  // Close the drawer on mobile after navigation
  const closeDrawer = () => {
    const drawerCheckbox = document.getElementById("nav-drawer") as HTMLInputElement | null;
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
          <ul className="m-4 w-64 no-scrollbar lg:w-80 max-h-96 overflow-y-auto bg-base-200 rounded-box shadow-lg z-99">
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
                            <Link to={`/presentation/${chapter.id}`} onClick={closeDrawer} className="text-center">
                              {chapter.number}
                            </Link>
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
          <div className="text-left w-1/3">
            <button
              className="btn btn-ghost btn-sm"
              aria-label="الإعدادات"
              onClick={() => (document.getElementById("settings_modal") as HTMLDialogElement | null)?.showModal()}
            >
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
