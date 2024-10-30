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
  setPresentationSettings: (
    newPresentationSettings: PresentationSettings
  ) => void;
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
  setPresentationSettings: (newPresentationSettings: any) =>
    set((state: any) => ({
      presentationSettings: {
        ...state.presentationSettings,
        newPresentationSettings,
      },
    })),
  setIsPresentationSettingsIconShown: (isShown: boolean) =>
    set((_: any) => ({ isPresentationSettingsIconShown: isShown })),
  setIsSettingsMenuOpen: (isOpen: boolean) =>
    set((_: any) => ({ isSettingsMenuOpen: isOpen })),
}));

export default useHymnosState;
