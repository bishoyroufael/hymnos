// contain code regarding global state managment using Zustand

import { create } from "zustand";

interface PresentationSettings {
  backgroundColor: string;
  fontColor: string;
  font: string;
  fontSize: number;
}

interface HymnosState {
  isPresentationSettingsIconShown: boolean;
  isSettingsMenuOpen: boolean;
  isEditingMode: boolean;
  presentationSettings: PresentationSettings;
  setPresentationSettings: (
    newPresentationSettings: Partial<PresentationSettings>
  ) => void;
  setIsPresentationSettingsIconShown: (isShown: boolean) => void;
  setIsSettingsMenuOpen: (isOpen: boolean) => void;
  setIsEditingMode: (isEditing: boolean) => void;
  setActiveMenu: (menu: string | null) => void;
  syncProgressPercentage: number;
  setSyncProgressPercentage: (progress: number) => void;
  activeMenu: string | null;
  currentView: "main" | "nested"; // New state to track the current view
  setCurrentView: (view: "main" | "nested") => void; // Setter for current view
}

const useHymnosState = create<HymnosState>((set) => ({
  isPresentationSettingsIconShown: false,
  isSettingsMenuOpen: false,
  isEditingMode: false,
  presentationSettings: {
    backgroundColor: "slate-900",
    fontColor: "blue-100",
    font: "Amiri_400Regular",
    fontSize: 60,
  },
  activeMenu: null,
  syncProgressPercentage: 0,
  currentView: "main", // Default to main menu view
  setPresentationSettings: (
    newPresentationSettings: Partial<PresentationSettings>
  ) =>
    set((state) => ({
      presentationSettings: {
        ...state.presentationSettings,
        ...newPresentationSettings,
      },
    })),
  setIsPresentationSettingsIconShown: (isShown: boolean) =>
    set(() => ({ isPresentationSettingsIconShown: isShown })),
  setIsSettingsMenuOpen: (isOpen: boolean) =>
    set(() => ({ isSettingsMenuOpen: isOpen })),
  setIsEditingMode: (isEditing: boolean) =>
    set(() => ({isEditingMode: isEditing})),
  setSyncProgressPercentage:(progress) => 
    set(() => ({ syncProgressPercentage:  progress})),
  setActiveMenu: (menu: string | null) => set((state) => ({ activeMenu: menu })),
  setCurrentView: (view: "main" | "nested") =>
    set(() => ({ currentView: view })),
}));

export default useHymnosState;