import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SearchFilters } from "../db/utils/search-types";
import { DEFAULT_SEARCH_FILTERS } from "../db/utils/search-types";
import type { CopiedBookNode } from "../db/utils/bookTree";

export interface PresentationSettings {
  theme: string;
  fontFamily: string;
  fontSizeScale: number; // 0.5 to 1.5 (50% to 150%)
  backgroundImage?: string; // base64 data URL, persisted to localStorage; undefined = no background
  backgroundBlur?: number; // CSS blur radius in px applied to the background image (default 0)
  backgroundOpacity?: number; // opacity of the background image layer, 0..1 (default 1)
  hiddenLanguages?: string[]; // language ids whose slide columns are hidden in view mode
}

export interface HymnosState {
  lastViewedContent: string[];
  presentationSettings: PresentationSettings;
  searchFilters: SearchFilters;
  copiedNode: CopiedBookNode | null; // book-node clipboard, persisted so copy/paste works across books

  // Actions
  setPresentationSettings: (settings: Partial<PresentationSettings>) => void;
  setLastViewedContent: (contentIds: string[]) => void;
  toggleSearchFilter: (filterKey: keyof SearchFilters) => void;
  setCopiedNode: (node: CopiedBookNode | null) => void;
}

const useHymnosStore = create<HymnosState>()(
  persist(
    (set) => ({
      // Initial state
      lastViewedContent: [],
      presentationSettings: {
        theme: "luxury",
        fontFamily: "font-amiri",
        fontSizeScale: 1.0, // 100%
      },
      searchFilters: DEFAULT_SEARCH_FILTERS,
      copiedNode: null,

      // Actions
      setPresentationSettings: (newSettings) =>
        set((state) => ({
          presentationSettings: {
            ...state.presentationSettings,
            ...newSettings,
          },
        })),

      setLastViewedContent: (contentIds) => set(() => ({ lastViewedContent: contentIds })),

      setCopiedNode: (node) => set(() => ({ copiedNode: node })),

      toggleSearchFilter: (filterKey) =>
        set((state) => ({
          searchFilters: {
            ...state.searchFilters,
            [filterKey]: !state.searchFilters[filterKey],
          },
        })),
    }),
    {
      name: "hymnos-storage",
      storage: createJSONStorage(() => localStorage),
      // Persist only the data fields, not the action functions.
      partialize: (state) => ({
        lastViewedContent: state.lastViewedContent,
        presentationSettings: state.presentationSettings,
        searchFilters: state.searchFilters,
        copiedNode: state.copiedNode,
      }),
    }
  )
);

export default useHymnosStore;
