import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import PresentationSettingsMenu from "../../components/PresentationSettingsMenu";
import Ionicons from "@expo/vector-icons/Ionicons";
import useHymnosState from "../../global";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { Rubik_400Regular } from "@expo-google-fonts/rubik";
import { BalooBhaijaan2_400Regular } from "@expo-google-fonts/baloo-bhaijaan-2";
interface Hymn {
  id: string;
  verses: string[];
  chorus: string;
}

export default function HymnPresentation() {
  const {
    isSettingsMenuOpen,
    setIsSettingsMenuOpen,
    isPresentationSettingsIconShown,
    setIsPresentationSettingsIconShown,
    presentationSettings,
    setPresentationSettings,
  } = useHymnosState();

  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);

  const hymn: Hymn = {
    id: "1",
    verses: [
      "Amazing grace! How sweet the sound That saved a wretch like me!",
      "I once was lost, but now am found; Was blind, but now I see.",
    ],
    chorus: "Praise the Lord! He is great and worthy of praise!",
  };

  const verses = [...hymn.verses, hymn.chorus]; // Combine verses and chorus for easier navigation

  // Auto-hide the menu after a few seconds
  useEffect(() => {
    if (isPresentationSettingsIconShown && !isSettingsMenuOpen) {
      const timer = setTimeout(
        () => setIsPresentationSettingsIconShown(false),
        3000
      );
      return () => clearTimeout(timer);
    }
  }, [isPresentationSettingsIconShown, isSettingsMenuOpen]);

  const handleMenuInteraction = (e: any) => {
    e.stopPropagation(); // Prevent parent interactions from hiding the menu
  };

  // Handle font selection
  const handleFontSelect = (fontFamily: string) => {
    setPresentationSettings({ font: fontFamily });
  };

  const [loaded, error] = useFonts({
    Amiri_400Regular,
    Rubik_400Regular,
    BalooBhaijaan2_400Regular,
  });
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
    // Example fetching hymn packs from a backend
    //fetchHymnPacks();
    //fetchLastViewedHymns();
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }
  return (
    <View
      className={`flex w-full h-full p-2 bg-${presentationSettings.backgroundColor}`}
      onPointerMove={() => {
        setIsPresentationSettingsIconShown(true); // Show menu icon on pointer move
      }}
    >
      {/* Hamburger Menu Icon */}
      {isPresentationSettingsIconShown && (
        <View className="absolute top-4 left-4 z-10 w-auto">
          <Pressable
            className="p-2 rounded-full w-auto h-auto"
            onPress={(e) => {
              e.stopPropagation(); // Prevent hiding on menu interaction
              setIsSettingsMenuOpen(!isSettingsMenuOpen); // Toggle settings menu
              //console.log("Settings Menu Open:", !isSettingsMenuOpen);
            }}
          >
            <Ionicons
              name="settings"
              size={30}
              className={`text-${presentationSettings.fontColor}`}
            />
          </Pressable>

          {/* Settings Menu */}
          {isSettingsMenuOpen && (
            <View
              onStartShouldSetResponder={() => true} // Capture touch events for menu
              onTouchStart={(e) => {
                e.stopPropagation(); // Stop propagation to avoid closing
                e.preventDefault(); // Prevent closing the menu when interacting
              }}
            >
              <PresentationSettingsMenu />
            </View>
          )}
        </View>
      )}

      {/* Hymn Text Display */}
      <Pressable
        className="flex-1 justify-center items-center cursor-default"
        onPress={() => {
          setIsPresentationSettingsIconShown(!isPresentationSettingsIconShown);
          setIsSettingsMenuOpen(false);
        }}
      >
        <Text
          className={`text-center text-4xl text-${presentationSettings.fontColor}`}
          style={{
            fontFamily: presentationSettings.font,
            fontSize: presentationSettings.fontSize || 60,
          }}
        >
          الوطن هو السماء {/* Displaying the fixed text */}
        </Text>
      </Pressable>
    </View>
  );
}
