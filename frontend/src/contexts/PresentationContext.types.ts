import type { components } from "../db/models";
import { BlockType } from "../db/models";

type SlideView = components["schemas"]["SlideView"];
type Language = components["schemas"]["Language"];

export interface PresentationSegment {
  content_id: string;
  content_type: string;
  slides: SlideView[];
}

export interface PresentationState {
  // Data
  contentId: string | null;
  contentType: string | null;
  segments: PresentationSegment[];
  segmentsBackup: PresentationSegment[] | null;
  languages: Language[];

  // UI State
  currSlideIdx: number;
  isEditingMode: boolean;
  isLoading: boolean;
  error: string | null;
}

export type PresentationAction =
  // Data Loading
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { contentId: string; contentType: string; segments: PresentationSegment[] } }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "SET_LANGUAGES"; payload: Language[] }

  // Navigation
  | { type: "SET_SLIDE_INDEX"; payload: number }
  | { type: "NEXT_SLIDE" }
  | { type: "PREV_SLIDE" }

  // Edit Mode
  | { type: "ENTER_EDIT_MODE" }
  | { type: "CANCEL_EDIT" }
  | { type: "SUBMIT_EDIT" }

  // Slide Operations
  | { type: "ADD_SLIDE"; payload: { position: "prev" | "next" } }
  | { type: "DELETE_SLIDE" }

  // Row Operations
  | { type: "ADD_ROW"; payload: { afterRowIndex: number } }
  | { type: "DELETE_ROW"; payload: { rowId: string } }

  // Column Operations
  | { type: "ADD_COLUMN"; payload: { rowId: string; afterColumnIndex: number } }
  | { type: "DELETE_COLUMN"; payload: { rowId: string; columnId: string } }
  | { type: "UPDATE_COLUMN_LANGUAGE"; payload: { columnId: string; languageId: string } }

  // Block Operations
  | { type: "ADD_BLOCK"; payload: { columnId: string; afterBlockIndex: number; blockType: BlockType } }
  | { type: "DELETE_BLOCK"; payload: { columnId: string; blockId: string } }
  | { type: "UPDATE_BLOCK"; payload: { blockId: string; content: string } };
