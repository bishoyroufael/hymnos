import React, { createContext, useCallback, useContext, useMemo, useReducer, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePGlite } from "@electric-sql/pglite-react";
import type { PGliteWithLive } from "@electric-sql/pglite/live";
import { toast } from "react-toastify";
import { presentationReducer, initialState } from "./PresentationContext.reducer";
import type { PresentationState, PresentationAction, PresentationSegment } from "./PresentationContext.types";
import type { components } from "../db/models";
import { upsertSlides } from "../db/crud/update/slide";
import { getBook, getBookSection } from "../db/crud/read/liturgy";

type ContentSlidesView = components["schemas"]["ContentSlidesView"];
type Language = components["schemas"]["Language"];

interface PresentationContextValue {
  state: PresentationState;
  dispatch: React.Dispatch<PresentationAction>;
  submitEdit: () => Promise<void>;
}

const PresentationContext = createContext<PresentationContextValue | undefined>(undefined);

interface PresentationProviderProps {
  children: React.ReactNode;
  uuid: string;
  startSlide?: string;
}

async function loadPresentation(db: PGliteWithLive, uuid: string): Promise<{ contentId: string; contentType: string; segments: PresentationSegment[] }> {
  const res = await db.query(`SELECT get_content_slides($1)::json as r`, [uuid]);
  if (res.rows.length === 0) throw new Error("not found");
  const raw = (res.rows[0] as { r: ContentSlidesView }).r;

  if (raw.content_type === "book") {
    const book = await getBook(db, uuid);
    if (!book) throw new Error("book not found");
    // Fetch all section slides concurrently; order is preserved by Promise.all.
    const sectionIds = book.chapters.flatMap((chapter) => chapter.sections.map((sec) => sec.section_id));
    const sections = await Promise.all(sectionIds.map((id) => getBookSection(db, id)));
    const segments: PresentationSegment[] = sectionIds.map((id, i) => ({
      content_id: id,
      content_type: "book_section",
      slides: sections[i]?.slides ?? [],
    }));
    return { contentId: uuid, contentType: "book", segments };
  }

  return {
    contentId: raw.content_id ?? uuid,
    contentType: raw.content_type,
    segments: [{ content_id: raw.content_id ?? uuid, content_type: raw.content_type, slides: raw.slides }],
  };
}

export function PresentationProvider({ children, uuid, startSlide }: PresentationProviderProps) {
  const [state, dispatch] = useReducer(presentationReducer, initialState);
  const db = usePGlite();
  const navigate = useNavigate();

  // Data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: "FETCH_START" });

      try {
        // Fetch languages
        const languagesResult = await db.query<Language>(`SELECT * FROM language ORDER BY name`);
        dispatch({ type: "SET_LANGUAGES", payload: languagesResult.rows });

        const result = await loadPresentation(db, uuid);

        if (result.segments.length === 0) {
          navigate("/not-found");
          return;
        }

        dispatch({ type: "FETCH_SUCCESS", payload: result });

        // Set start slide if provided
        if (startSlide) {
          const allSlides = result.segments.flatMap((s) => s.slides);
          let idx = allSlides.findIndex((s) => s.slide_id === startSlide);
          if (idx === -1) {
            // startSlide is a section_uuid: find segment's first slide
            let offset = 0;
            for (const seg of result.segments) {
              if (seg.content_id === startSlide) {
                idx = offset;
                break;
              }
              offset += seg.slides.length;
            }
          }
          if (idx !== -1) dispatch({ type: "SET_SLIDE_INDEX", payload: idx });
        }
      } catch (error) {
        console.error("Failed to fetch presentation data:", error);
        dispatch({ type: "FETCH_ERROR", payload: String(error) });
        navigate("/not-found");
      }
    };

    fetchData();
  }, [uuid, startSlide, db, navigate]);

  // Keyboard navigation effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.isEditingMode && (e.target as HTMLElement).tagName === "DIV") {
        return;
      }

      switch (e.key) {
        case "Escape":
          navigate(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          dispatch({ type: "NEXT_SLIDE" });
          break;
        case "ArrowLeft":
          e.preventDefault();
          dispatch({ type: "PREV_SLIDE" });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isEditingMode, navigate]);

  // Handler for submitting edits and saving to database
  const submitEdit = useCallback(async () => {
    if (state.segments.length === 0) {
      console.error("No presentation data to save");
      toast.error("لا توجد بيانات للحفظ");
      return;
    }

    try {
      for (const seg of state.segments) {
        if (seg.content_type !== "bible_chapter") {
          await upsertSlides(db, seg.content_id, seg.content_type as any, seg.slides);
        }
      }

      // Force flush to IndexedDB (needed because relaxedDurability is enabled)
      await db.exec("CHECKPOINT");

      dispatch({ type: "SUBMIT_EDIT" });
      toast.success("تم حفظ الشرائح");
    } catch (error) {
      console.error("Failed to save presentation edits:", error);
      toast.error("تعذّر حفظ الشرائح");
      throw error;
    }
  }, [state.segments, db]);

  // Memoized so consumers don't re-render when the provider re-renders for
  // reasons other than a state change (dispatch is stable across renders).
  const value = useMemo(() => ({ state, dispatch, submitEdit }), [state, submitEdit]);

  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
}

// Custom hook to use the context
export function usePresentation() {
  const context = useContext(PresentationContext);
  if (!context) {
    throw new Error("usePresentation must be used within PresentationProvider");
  }
  return context;
}
