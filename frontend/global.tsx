// contain code regarding global state managment using Zustand

import { RFPercentage } from "react-native-responsive-fontsize";
import { create } from "zustand";

interface PresentationSettings {
  backgroundColor: string;
  fontColor: string;
  font: string;
  fontSize: number;
}

interface HymnosState {
  searchDebounceDelay: number;
  enableFuzzySearch: boolean;
  presentationSettings: PresentationSettings;
  setPresentationSettings: (
    newPresentationSettings: Partial<PresentationSettings>,
  ) => void;
  setEnableFuzzySearch: (enable: boolean) => void;
  setActiveMenu: (menu: string | null) => void;
  syncProgressPercentage: number;
  setSearchDebounceDelay: (delay: number) => void;
  setSyncProgressPercentage: (progress: number) => void;
  activeMenu: string | null;
  currentView: "main" | "nested"; // New state to track the current view
  setCurrentView: (view: "main" | "nested") => void; // Setter for current view
}

const useHymnosState = create<HymnosState>((set) => ({
  searchDebounceDelay: 100,
  enableFuzzySearch: false,
  presentationSettings: {
    backgroundColor: "slate-900",
    fontColor: "blue-100",
    font: "Amiri_700Bold",
    fontSize: RFPercentage(7),
  },
  activeMenu: null,
  syncProgressPercentage: 0,
  currentView: "main", // Default to main menu view
  setEnableFuzzySearch: (enable: boolean) =>
    set(() => ({ enableFuzzySearch: enable })),
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
  setActiveMenu: (menu: string | null) => set(() => ({ activeMenu: menu })),
  setCurrentView: (view: "main" | "nested") =>
    set(() => ({ currentView: view })),
}));

export default useHymnosState;
