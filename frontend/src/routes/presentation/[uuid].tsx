import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { usePGlite } from "@electric-sql/pglite-react";
import { toast } from "react-toastify";
import { PresentationProvider, usePresentation } from "../../contexts/PresentationContext";
import SlideContent from "../../components/presentation/SlideContent";
import { Toolbar, PlusButton } from "../../components/presentation/Toolbar";
import BackgroundModal from "../../components/presentation/BackgroundModal";
import BookTocDrawer, { BOOK_TOC_DRAWER_ID } from "../../components/presentation/BookTocDrawer";
import Logo from "../../components/presentation/Logo";
import Loader from "../../components/base/Loader";
import useHymnosStore from "../../store";
import { getBook, getBookBySectionId } from "../../db/crud/read/liturgy";
import type { components } from "../../db/models";

type BookView = components["schemas"]["BookView"];

function PresentationContent() {
  const { state, dispatch } = usePresentation();
  const navigate = useNavigate();
  const db = usePGlite();

  const presentationSettings = useHymnosStore((state) => state.presentationSettings);

  const [parentBook, setParentBook] = useState<BookView | null>(null);

  useEffect(() => {
    if (!state.contentId || state.isLoading) return;
    setParentBook(null);
    if (state.contentType === "book") {
      getBook(db, state.contentId).then((book) => {
        if (book) setParentBook(book);
      });
    } else if (state.contentType === "book_section") {
      getBookBySectionId(db, state.contentId).then((book) => {
        if (book) setParentBook(book);
      });
    }
  }, [state.contentType, state.contentId, state.isLoading, db]);

  const flatSlides = state.segments.flatMap((s) => s.slides);
  const slidesLength = flatSlides.length;
  const currentSlide = flatSlides[state.currSlideIdx];
  const contentType = state.contentType;
  const isEndSlide = state.currSlideIdx === slidesLength;
  const isBibleChapter = contentType === "bible_chapter";
  const isBookSection = contentType === "book_section" || contentType === "book";

  // Mouse click navigation
  const handleSlideClick = useCallback(
    (e: React.MouseEvent) => {
      if (state.isEditingMode && (e.target as HTMLElement).tagName === "TEXTAREA") {
        return;
      }

      const clickX = e.clientX;
      const windowWidth = window.innerWidth;

      if (clickX / windowWidth <= 0.2) {
        dispatch({ type: "PREV_SLIDE" });
      } else if (clickX / windowWidth >= 0.8) {
        dispatch({ type: "NEXT_SLIDE" });
      }
    },
    [state.isEditingMode, dispatch]
  );

  // Share handler
  const handleShare = useCallback(async () => {
    if (!currentSlide?.slide_rows) return;

    const textToShare = currentSlide.slide_rows
      .flatMap((row) => row.slide_columns?.flatMap((col) => col.blocks.map((block) => block.content)) || [])
      .join("\n\n");

    try {
      if (navigator.share) {
        await navigator.share({ text: textToShare, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(textToShare);
        toast.success("تم نسخ النص");
      }
    } catch (error) {
      // Ignore user-cancelled share; surface genuine failures only.
      if ((error as Error)?.name !== "AbortError") {
        console.error("Failed to share:", error);
        toast.error("تعذّر مشاركة النص");
      }
    }
  }, [currentSlide]);

  // Info handler
  const handleInfo = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    if (parentBook) {
      navigate(`/book/${parentBook.book_id}`);
    } else {
      navigate(`/hymn/${state.contentId}`);
    }
  };

  if (state.isLoading) {
    return <Loader />;
  }

  if (state.segments.length === 0) {
    return <Loader />;
  }

  // Early return for end slide
  if (isEndSlide) {
    return (
      <div
        data-theme={presentationSettings.theme}
        className="w-full h-screen flex items-center justify-center cursor-default bg-base-100 text-base-content"
        onClick={handleSlideClick}
      >
        <div className="flex flex-col gap-4 text-center">
          <Logo />
          <p>Copyright © {new Date().getFullYear()} - All right reserved</p>
        </div>
      </div>
    );
  }

  const slideView = (
    <div
      data-theme={presentationSettings.theme}
      className="relative isolate overflow-hidden w-full h-screen flex items-center justify-center cursor-default bg-base-100 text-base-content"
      onClick={handleSlideClick}
    >
      {presentationSettings.backgroundImage && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none bg-center bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url("${presentationSettings.backgroundImage}")`,
            // Behind the slide content (parent has `isolate` for a clean stacking context).
            zIndex: -10,
            // Opacity + blur affect only this layer so the slide text stays sharp;
            // scale up so the blur's soft edges don't reveal the background underneath.
            opacity: presentationSettings.backgroundOpacity ?? 1,
            filter: `blur(${presentationSettings.backgroundBlur ?? 0}px)`,
            transform: "scale(1.1)",
          }}
        />
      )}

      <Toolbar
        isBibleChapter={isBibleChapter}
        onInfo={handleInfo}
        onShare={handleShare}
        tocDrawerId={isBookSection && parentBook ? BOOK_TOC_DRAWER_ID : undefined}
      />

      {state.isEditingMode && (
        <>
          <PlusButton position="left" onClick={() => dispatch({ type: "ADD_SLIDE", payload: { position: "prev" } })} />
          <PlusButton position="right" onClick={() => dispatch({ type: "ADD_SLIDE", payload: { position: "next" } })} />
        </>
      )}

      <SlideContent slide={currentSlide} />

      <div dir="ltr" className="absolute bottom-2 left-2 text-xl opacity-70 text-base-content">
        {state.currSlideIdx + 1} | {slidesLength}
      </div>

      <BackgroundModal />
    </div>
  );

  if (isBookSection && parentBook) {
    return (
      <BookTocDrawer book={parentBook} theme={presentationSettings.theme}>
        {slideView}
      </BookTocDrawer>
    );
  }

  return slideView;
}

export default function PresentationPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const startSlide = searchParams.get("startSlide") || undefined;

  // Track recently viewed content
  const setLastViewedContent = useHymnosStore((state) => state.setLastViewedContent);
  const lastViewedContent = useHymnosStore((state) => state.lastViewedContent);

  useEffect(() => {
    if (uuid) {
      const updatedViewedContent = lastViewedContent.filter((id) => id !== uuid);
      updatedViewedContent.push(uuid);
      const limitedContent = updatedViewedContent.slice(-15);
      setLastViewedContent(limitedContent);
    }
  }, [uuid, setLastViewedContent]);

  if (!uuid) {
    navigate("/not-found");
    return null;
  }

  return (
    <PresentationProvider uuid={uuid} startSlide={startSlide}>
      <PresentationContent />
    </PresentationProvider>
  );
}
