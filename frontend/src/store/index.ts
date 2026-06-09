import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SearchFilters } from "../db/utils/search-types";
import { DEFAULT_SEARCH_FILTERS } from "../db/utils/search-types";

export interface PresentationSettings {
  theme: string;
  fontFamily: string;
  fontSizeScale: number; // 0.5 to 1.5 (50% to 150%)
  backgroundImage?: string; // base64 data URL, persisted to localStorage; undefined = no background
  backgroundBlur?: number; // CSS blur radius in px applied to the background image (default 0)
  backgroundOpacity?: number; // opacity of the background image layer, 0..1 (default 1)
}

export interface HymnosState {
  lastViewedContent: string[];
  presentationSettings: PresentationSettings;
  searchFilters: SearchFilters;

  // Actions
  setPresentationSettings: (settings: Partial<PresentationSettings>) => void;
  setLastViewedContent: (contentIds: string[]) => void;
  toggleSearchFilter: (filterKey: keyof SearchFilters) => void;
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

      // Actions
      setPresentationSettings: (newSettings) =>
        set((state) => ({
          presentationSettings: {
            ...state.presentationSettings,
            ...newSettings,
          },
        })),

      setLastViewedContent: (contentIds) => set(() => ({ lastViewedContent: contentIds })),

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
      // Persist all state
      partialize: (state) => Object.fromEntries(Object.entries(state)),
    }
  )
);

export default useHymnosStore;
