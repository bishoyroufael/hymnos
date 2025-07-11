import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Rubik_300Light,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik";
import { Amiri_700Bold } from "@expo-google-fonts/amiri";
import { Zain_700Bold } from "@expo-google-fonts/zain";
import { BalooBhaijaan2_700Bold } from "@expo-google-fonts/baloo-bhaijaan-2";
import { Lalezar_400Regular } from "@expo-google-fonts/lalezar";

// Mapping of tailwindcss classes to font names
export const fontWeightMap: Record<string, string> = {
  "font-light": "Rubik_300Light",
  "font-regular": "Rubik_400Regular",
  "font-medium": "Rubik_500Medium",
  "font-semibold": "Rubik_600SemiBold",
  "font-bold": "Rubik_700Bold",
};

export function useHymnosFonts() {
  const [fontsLoaded] = useFonts({
    Rubik_300Light,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
    // Presentation Fonts
    Amiri_700Bold,
    Zain_700Bold,
    BalooBhaijaan2_700Bold,
    Lalezar_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return fontsLoaded;
}

export function getFontFamilyFromClassName(className?: string) {
  return fontWeightMap[
    Object.keys(fontWeightMap).find((v) => className?.includes(v)) ??
      "font-regular"
  ];
}
