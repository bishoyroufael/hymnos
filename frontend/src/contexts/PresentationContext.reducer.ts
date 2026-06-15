import { produce } from "immer";
import type { PresentationState, PresentationAction, PresentationSegment } from "./PresentationContext.types";
import { BlockType } from "../db/models";
import type { components } from "../db/models";
import { uuidv7 } from "uuidv7";

type SlideView = components["schemas"]["SlideView"];
type Language = components["schemas"]["Language"];

export const initialState: PresentationState = {
  contentId: null,
  contentType: null,
  segments: [],
  segmentsBackup: null,
  languages: [],
  currSlideIdx: 0,
  isEditingMode: false,
  isLoading: true,
  error: null,
};

function findSegment(segments: PresentationSegment[], globalIdx: number) {
  let offset = 0;
  for (const seg of segments) {
    if (globalIdx < offset + seg.slides.length) {
      return { segment: seg, localIdx: globalIdx - offset };
    }
    offset += seg.slides.length;
  }
  return null;
}

// Helper functions for finding nested objects
function findBlock(slide: any, blockId: string) {
  for (const row of slide?.slide_rows || []) {
    for (const col of row?.slide_columns || []) {
      const block = col.blocks.find((b: any) => b.id === blockId);
      if (block) return block;
    }
  }
  return null;
}

function reindexPositions<T extends { position: number }>(items: T[]) {
  items.forEach((item, idx) => {
    item.position = idx;
  });
}

function createEmptySlide(defaultLanguage: Language): SlideView {
  return {
    slide_id: uuidv7(),
    position: 0,
    slide_rows: [
      {
        id: uuidv7(),
        position: 0,
        columns: 1,
        slide_columns: [
          {
            id: uuidv7(),
            position: 0,
            language: defaultLanguage,
            blocks: [
              {
                id: uuidv7(),
                position: 0,
                content: "",
                metadata: { type: BlockType.paragraph },
              },
            ],
          },
        ],
      },
    ],
  };
}

export const presentationReducer = produce((draft: PresentationState, action: PresentationAction) => {
  switch (action.type) {
    // === DATA LOADING ===
    case "FETCH_START":
      draft.isLoading = true;
      draft.error = null;
      break;

    case "FETCH_SUCCESS":
      draft.contentId = action.payload.contentId;
      draft.contentType = action.payload.contentType;
      draft.segments = action.payload.segments;
      draft.segmentsBackup = null;
      draft.currSlideIdx = 0;
      draft.isLoading = false;
      draft.error = null;
      break;

    case "FETCH_ERROR":
      draft.isLoading = false;
      draft.error = action.payload;
      break;

    case "SET_LANGUAGES":
      draft.languages = action.payload;
      break;

    // === NAVIGATION ===
    case "SET_SLIDE_INDEX":
      draft.currSlideIdx = action.payload;
      break;

    case "NEXT_SLIDE": {
      const total = draft.segments.reduce((n, s) => n + s.slides.length, 0);
      if (draft.currSlideIdx < total) {
        draft.currSlideIdx++;
      }
      break;
    }

    case "PREV_SLIDE": {
      if (draft.currSlideIdx > 0) {
        draft.currSlideIdx--;
      }
      break;
    }

    // === EDIT MODE ===
    case "ENTER_EDIT_MODE":
      draft.isEditingMode = true;
      // Snapshot by reference, not a deep clone: Immer's structural sharing keeps
      // this cheap, and untouched segments keep the same reference after edits — so
      // submitEdit can detect changes with an O(1) reference check.
      draft.segmentsBackup = draft.segments;
      break;

    case "CANCEL_EDIT":
      draft.segments = draft.segmentsBackup!;
      draft.segmentsBackup = null;
      draft.isEditingMode = false;
      break;

    case "SUBMIT_EDIT":
      draft.segmentsBackup = null;
      draft.isEditingMode = false;
      break;

    // === SLIDE OPERATIONS ===
    case "ADD_SLIDE": {
      const defaultLanguage = draft.languages[0];
      if (!defaultLanguage) break;

      const found = findSegment(draft.segments, draft.currSlideIdx);
      if (!found) break;

      const { segment, localIdx } = found;
      const newSlide = createEmptySlide(defaultLanguage);
      const insertIdx = action.payload.position === "next" ? localIdx + 1 : localIdx;

      segment.slides.splice(insertIdx, 0, newSlide);
      reindexPositions(segment.slides);

      if (action.payload.position === "next") {
        draft.currSlideIdx++;
      }
      break;
    }

    case "DELETE_SLIDE": {
      const found = findSegment(draft.segments, draft.currSlideIdx);
      if (!found) break;

      const { segment, localIdx } = found;
      if (segment.slides.length <= 1) break;

      segment.slides.splice(localIdx, 1);
      reindexPositions(segment.slides);

      const total = draft.segments.reduce((n, s) => n + s.slides.length, 0);
      if (draft.currSlideIdx >= total) {
        draft.currSlideIdx = total - 1;
      }
      break;
    }

    // === ROW OPERATIONS ===
    case "ADD_ROW": {
      const found = findSegment(draft.segments, draft.currSlideIdx);
      if (!found) break;

      const currentSlide = found.segment.slides[found.localIdx];
      if (!currentSlide?.slide_rows) break;

      const defaultLanguage = draft.languages[0];
      if (!defaultLanguage) break;

      const newRow = {
        id: uuidv7(),
        position: action.payload.afterRowIndex + 1,
        columns: 1,
        slide_columns: [
          {
            id: uuidv7(),
            position: 0,
            language: defaultLanguage,
            blocks: [
              {
                id: uuidv7(),
                position: 0,
                content: "",
                metadata: { type: BlockType.paragraph },
              },
            ],
          },
        ],
      };

      currentSlide.slide_rows.splice(action.payload.afterRowIndex + 1, 0, newRow);
      reindexPositions(currentSlide.slide_rows);
      break;
    }

    case "DELETE_ROW": {
      const found = findSegment(draft.segments, draft.currSlideIdx);
      if (!found) break;

      const currentSlide = found.segment.slides[found.localIdx];
      if (!currentSlide?.slide_rows || currentSlide.slide_rows.length <= 1) break;

      const rowIndex = currentSlide.slide_rows.findIndex((r) => r.id === action.payload.rowId);
      if (rowIndex === -1) break;

      currentSlide.slide_rows.splice(rowIndex, 1);
      reindexPositions(currentSlide.slide_rows);
      break;
    }

    // === COLUMN OPERATIONS ===
    case "ADD_COLUMN": {
      const found = findSegment(draft.segments, draft.currSlideIdx);
      if (!found) break;

      const currentSlide = found.segment.slides[found.localIdx];
      if (!currentSlide) break;

      const row = currentSlide.slide_rows?.find((r) => r.id === action.payload.rowId);
      if (!row?.slide_columns) break;

      const defaultLanguage = draft.languages[0];
      if (!defaultLanguage) break;

      const newColumn = {
        id: uuidv7(),
        position: action.payload.afterColumnIndex + 1,
        language: defaultLanguage,
        blocks: [
          {
            id: uuidv7(),
            position: 0,
            content: "",
            metadata: { type: BlockType.paragraph },
          },
        ],
      };

      row.slide_columns.splice(action.payload.afterColumnIndex + 1, 0, newColumn);
      reindexPositions(row.slide_columns);
      row.columns = row.slide_columns.length;
      break;
    }

    case "DELETE_COLUMN": {
      const found = findSegment(draft.segments, draft.currSlideIdx);
      if (!found) break;

      const currentSlide = found.segment.slides[found.localIdx];
      if (!currentSlide) break;

      const row = currentSlide.slide_rows?.find((r) => r.id === action.payload.rowId);
      if (!row?.slide_columns || row.slide_columns.length <= 1) break;

      const colIndex = row.slide_columns.findIndex((c) => c.id === action.payload.columnId);
      if (colIndex === -1) break;

      row.slide_columns.splice(colIndex, 1);
      reindexPositions(row.slide_columns);
      row.columns = row.slide_columns.length;
      break;
    }

    case "UPDATE_COLUMN_LANGUAGE": {
      const found = findSegment(draft.segments, draft.currSlideIdx);
      if (!found) break;

      const currentSlide = found.segment.slides[found.localIdx];
      if (!currentSlide) break;

      const language = draft.languages.find((l) => l.id === action.payload.languageId);
      if (!language) break;

      for (const row of currentSlide.slide_rows || []) {
        const column = row.slide_columns?.find((c: any) => c.id === action.payload.columnId);
        if (column) {
          column.language = language;
          break;
        }
      }
      break;
    }

    // === BLOCK OPERATIONS ===
    case "ADD_BLOCK": {
      const found = findSegment(draft.segments, draft.currSlideIdx);
      if (!found) break;

      const currentSlide = found.segment.slides[found.localIdx];
      if (!currentSlide) break;

      let targetColumn: any = null;
      for (const row of currentSlide.slide_rows || []) {
        targetColumn = row.slide_columns?.find((c: any) => c.id === action.payload.columnId);
        if (targetColumn) break;
      }

      if (!targetColumn) break;

      const newBlock = {
        id: uuidv7(),
        position: action.payload.afterBlockIndex + 1,
        content: "",
        metadata: { type: action.payload.blockType },
      };

      targetColumn.blocks.splice(action.payload.afterBlockIndex + 1, 0, newBlock);
      reindexPositions(targetColumn.blocks);
      break;
    }

    case "DELETE_BLOCK": {
      const found = findSegment(draft.segments, draft.currSlideIdx);
      if (!found) break;

      const currentSlide = found.segment.slides[found.localIdx];
      if (!currentSlide) break;

      let targetColumn: any = null;
      for (const row of currentSlide.slide_rows || []) {
        targetColumn = row.slide_columns?.find((c: any) => c.id === action.payload.columnId);
        if (targetColumn) break;
      }

      if (!targetColumn || targetColumn.blocks.length <= 1) break;

      const blockIndex = targetColumn.blocks.findIndex((b: any) => b.id === action.payload.blockId);
      if (blockIndex === -1) break;

      targetColumn.blocks.splice(blockIndex, 1);
      reindexPositions(targetColumn.blocks);
      break;
    }

    case "UPDATE_BLOCK": {
      const found = findSegment(draft.segments, draft.currSlideIdx);
      if (!found) break;

      const currentSlide = found.segment.slides[found.localIdx];
      if (!currentSlide) break;

      const block = findBlock(currentSlide, action.payload.blockId);
      if (block) {
        block.content = action.payload.content;
      }
      break;
    }
  }
});
