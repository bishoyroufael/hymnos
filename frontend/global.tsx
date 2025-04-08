// contain code regarding global state managment using Zustand

import { create } from "zustand";

interface PresentationSettings {
  backgroundColor: string;
  fontColor: string;
  font: string;
  fontSize: number; // Add fontSize
}

interface HymnosState {
  isPresentationSettingsIconShown: boolean;
  isSettingsMenuOpen: boolean;
  presentationSettings: PresentationSettings;
  setPresentationSettings: (
    newPresentationSettings: Partial<PresentationSettings>
  ) => void; // Allow partial updates
  setIsPresentationSettingsIconShown: (isShown: boolean) => void;
  setIsSettingsMenuOpen: (isOpen: boolean) => void;
  setActiveMenu: (menu: string | null) => void; // Setter for active menu
  syncProgressPercentage: number;
  setSyncProgressPercentage: (progress: number) => void;
  activeMenu: string | null; // Add activeMenu to the state interface
}

const useHymnosState = create<HymnosState>((set) => ({
  isPresentationSettingsIconShown: false,
  isSettingsMenuOpen: false,
  presentationSettings: {
    backgroundColor: "slate-900",
    fontColor: "blue-100",
    font: "Amiri_400Regular",
    fontSize: 60, // Default font size
  },
  activeMenu: null, // Initially, no menu is open
  syncProgressPercentage: 0,
  setPresentationSettings: (
    newPresentationSettings: Partial<PresentationSettings>
  ) =>
    set((state) => ({
      presentationSettings: {
        ...state.presentationSettings,
        ...newPresentationSettings, // Merge new settings with existing ones
      },
    })),
  setIsPresentationSettingsIconShown: (isShown: boolean) =>
    set(() => ({ isPresentationSettingsIconShown: isShown })),
  setIsSettingsMenuOpen: (isOpen: boolean) =>
    set(() => ({ isSettingsMenuOpen: isOpen })),
  setActiveMenu: (menu: string | null) => set((state) => ({ activeMenu: menu })),
  setSyncProgressPercentage:(progress) => 
    set(() => ({ syncProgressPercentage:  progress})),
}));

export default useHymnosState;
