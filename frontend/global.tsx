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
}));

export default useHymnosState;
