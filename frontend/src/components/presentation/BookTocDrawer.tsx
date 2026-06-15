import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBook } from "react-icons/fi";
import type { components } from "@/db/models";
import { usePresentation } from "@/contexts/PresentationContext";

type BookView = components["schemas"]["BookView"];

export const BOOK_TOC_DRAWER_ID = "book-toc-drawer";

interface BookTocDrawerProps {
  book: BookView;
  theme: string;
  children: React.ReactNode;
}

export default function BookTocDrawer({ book, theme, children }: BookTocDrawerProps) {
  const navigate = useNavigate();
  const { state, dispatch } = usePresentation();

  const isBookMode = state.contentType === "book";

  // Derive current section from segments
  let currentSectionId: string | undefined;
  if (isBookMode) {
    let offset = 0;
    for (const seg of state.segments) {
      if (state.currSlideIdx < offset + seg.slides.length) {
        currentSectionId = seg.content_id;
        break;
      }
      offset += seg.slides.length;
    }
  } else {
    currentSectionId = state.contentId ?? undefined;
  }

  // Lazy initializer: computed once on mount, so no memo/deps gymnastics needed.
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(book.chapters.filter((c) => c.sections.some((s) => s.section_id === currentSectionId)).map((c) => c.chapter_id)),
  );

  // Keep the chapter containing the current section always expanded on navigation
  useEffect(() => {
    const chapter = book.chapters.find((c) => c.sections.some((s) => s.section_id === currentSectionId));
    if (chapter) setExpanded((prev) => new Set([...prev, chapter.chapter_id]));
  }, [currentSectionId, book.chapters]);

  const toggleChapter = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const handleSectionClick = (sectionId: string) => {
    if (isBookMode) {
      let idx = 0;
      for (const seg of state.segments) {
        if (seg.content_id === sectionId) break;
        idx += seg.slides.length;
      }
      dispatch({ type: "SET_SLIDE_INDEX", payload: idx });
      const el = document.getElementById(BOOK_TOC_DRAWER_ID) as HTMLInputElement | null;
      if (el) el.checked = false;
    } else {
      navigate(`/presentation/${book.book_id}?startSlide=${sectionId}`);
    }
  };

  return (
    <div data-theme={theme} className="drawer h-screen w-full">
      <input id={BOOK_TOC_DRAWER_ID} type="checkbox" className="drawer-toggle" />

      <div className="drawer-content">{children}</div>

      <div className="drawer-side z-30">
        <label htmlFor={BOOK_TOC_DRAWER_ID} aria-label="close sidebar" className="drawer-overlay" />
        <div className="bg-base-200 min-h-full w-80 flex flex-col" dir="rtl">
          {/* Header */}
          <div className="p-4 border-b border-base-300 flex items-center gap-2 shrink-0">
            <FiBook className="w-5 h-5 text-primary shrink-0" />
            <span className="font-bold text-lg truncate">{book.name}</span>
          </div>

          {/* TOC */}
          <ul className="menu menu-sm flex-1 overflow-y-auto p-2 w-full">
            {book.chapters.map((chapter) => (
              <li key={chapter.chapter_id}>
                <details open={expanded.has(chapter.chapter_id)}>
                  <summary
                    className="font-semibold text-base"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleChapter(chapter.chapter_id);
                    }}
                  >
                    {chapter.name}
                  </summary>
                  <ul>
                    {chapter.sections.map((section) => (
                      <li key={section.section_id}>
                        <button
                          type="button"
                          className={`text-right${section.section_id === currentSectionId ? " menu-active" : ""}`}
                          aria-current={section.section_id === currentSectionId ? "true" : undefined}
                          onClick={() => handleSectionClick(section.section_id)}
                        >
                          {section.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
