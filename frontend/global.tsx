// contain code regarding global state managment using Zustand

import { create } from "zustand";

interface PresentationSettings {
  backgroundColor: string;
  fontColor: string;
  font: string;
}

interface HymnosState {
  isPresentationSettingsIconShown: boolean;
  isSettingsMenuOpen: boolean;
  presentationSettings: PresentationSettings;
  setPresentationSettings: (newPresentationSettings: Partial<PresentationSettings>) => void; // Allow partial updates
  setIsPresentationSettingsIconShown: (isShown: boolean) => void;
  setIsSettingsMenuOpen: (isOpen: boolean) => void;
}

const useHymnosState = create<HymnosState>((set) => ({
  isPresentationSettingsIconShown: false,
  isSettingsMenuOpen: false,
  presentationSettings: {
    backgroundColor: "sky-100",
    fontColor: "slate-900",
    font: "Amiri_400Regular",
  },
  setPresentationSettings: (newPresentationSettings: Partial<PresentationSettings>) =>
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