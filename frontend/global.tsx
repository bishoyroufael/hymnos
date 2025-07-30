// contain code regarding global state managment using Zustand
import { handleImportUserData } from "@db/utils/import";
import { HymnosState, PresentationSettings } from "global.interfaces";
import { RFPercentage } from "react-native-responsive-fontsize";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useHymnosState = create<HymnosState>()(
  persist(
    (set) => ({
      isloadingData: true,
      importUserDataStatus: "idle",
      lastViewedContent: [],
      searchDebounceDelay: 100,
      presentationSettings: {
        backgroundColor: "slate-900",
        fontColor: "blue-100",
        font: "Rubik_700Bold",
        fontSize: RFPercentage(6),
      },
      syncProgressPercentage: 0,
      setLastViewedContent: (newLastViewedHymns: string[]) =>
        set(() => ({ lastViewedContent: newLastViewedHymns })),
      setIsloadingData: (isFetching: boolean) =>
        set(() => ({ isloadingData: isFetching })),
      setPresentationSettings: (
        newPresentationSettings: Partial<PresentationSettings>,
      ) =>
        set((state) => ({
          presentationSettings: {
            ...state.presentationSettings,
            ...newPresentationSettings,
          },
        })),
      setSearchDebounceDelay: (delay: number) =>
        set(() => ({ searchDebounceDelay: delay })),
      setSyncProgressPercentage: (progress) =>
        set(() => ({ syncProgressPercentage: progress })),
      importUserData: (db) => handleImportUserData(db, set),
    }),
    {
      name: "hymnos-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) =>
              ![
                "isloadingData",
                "syncProgressPercentage",
                "importUserDataStatus",
              ].includes(key),
          ),
        ),
    },
  ),
);

export default useHymnosState;
