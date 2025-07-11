import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Amiri_700Bold } from "@expo-google-fonts/amiri";
import { Zain_700Bold } from "@expo-google-fonts/zain";
import { BalooBhaijaan2_700Bold } from "@expo-google-fonts/baloo-bhaijaan-2";
import { Lalezar_400Regular } from "@expo-google-fonts/lalezar";
import { useFonts } from "expo-font";

export function usePresentationFonts() {
  const [fontsLoaded] = useFonts({
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
