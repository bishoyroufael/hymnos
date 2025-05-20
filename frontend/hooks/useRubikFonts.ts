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

export const fontWeightMap: Record<string, string> = {
  "font-light": "Rubik_300Light",
  "font-regular": "Rubik_400Regular",
  "font-medium": "Rubik_500Medium",
  "font-semibold": "Rubik_600SemiBold",
  "font-bold": "Rubik_700Bold",
};

export function useRubikFonts() {
  const [fontsLoaded] = useFonts({
    Rubik_300Light,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
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
