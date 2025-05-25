// contain code regarding global state managment using Zustand

import { Dimensions } from "react-native";
import { create } from "zustand";

interface PresentationSettings {
  backgroundColor: string;
  fontColor: string;
  font: string;
  fontSize: number;
}

interface HymnosState {
  searchDebounceDelay: number;
  presentationSettings: PresentationSettings;
  setPresentationSettings: (
    newPresentationSettings: Partial<PresentationSettings>,
  ) => void;
  setActiveMenu: (menu: string | null) => void;
  syncProgressPercentage: number;
  setSearchDebounceDelay: (delay: number) => void;
  setSyncProgressPercentage: (progress: number) => void;
  activeMenu: string | null;
  currentView: "main" | "nested"; // New state to track the current view
  setCurrentView: (view: "main" | "nested") => void; // Setter for current view
}

const useHymnosState = create<HymnosState>((set) => ({
  searchDebounceDelay: 200,
  presentationSettings: {
    backgroundColor: "slate-900",
    fontColor: "blue-100",
    font: "Amiri_400Regular",
    fontSize: Dimensions.get("screen").width > 640 ? 80 : 40,
  },
  activeMenu: null,
  syncProgressPercentage: 0,
  currentView: "main", // Default to main menu view
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
