import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { Cairo_400Regular } from "@expo-google-fonts/cairo";
import { BalooBhaijaan2_400Regular } from "@expo-google-fonts/baloo-bhaijaan-2";
import { Lateef_400Regular } from "@expo-google-fonts/lateef";
import { useFonts } from "expo-font";

export function usePresentationFonts() {
  const [fontsLoaded] = useFonts({
    Amiri_400Regular,
    Cairo_400Regular,
    BalooBhaijaan2_400Regular,
    Lateef_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return fontsLoaded;
}
