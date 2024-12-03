import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import PresentationSettingsMenu from "../../components/PresentationSettingsMenu";
import Ionicons from "@expo/vector-icons/Ionicons";
import useHymnosState from "../../global";

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
  //   const isSettingsMenuOpen = useHymnosState(
  //     (state) => state.isSettingsMenuOpen
  //   );
  //   const setIsSettingsMenuOpen = useHymnosState(
  //     (state) => state.setIsSettingsMenuOpen
  //   );
  //   const isPresentationSettingsIconShown = useHymnosState(
  //     (state) => state.isPresentationSettingsIconShown
  //   );
  //   const setIsPresentationSettingsIconShown = useHymnosState(
  //     (state) => state.setIsPresentationSettingsIconShown
  //   );
  //   const presentationSettings = useHymnosState(
  //     (state) => state.presentationSettings
  //   );
  //   const setPresentationSettings = useHymnosState(
  //     (state) => state.setPresentationSettings
  //   );

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

  //   Auto-hide the menu after a few seconds
  useEffect(() => {
    if (isPresentationSettingsIconShown && !isSettingsMenuOpen) {
      const timer = setTimeout(
        () => setIsPresentationSettingsIconShown(false),
        3000
      );
      return () => clearTimeout(timer);
    }
  }, [isPresentationSettingsIconShown, isSettingsMenuOpen]);

  return (
    <View
      className={`flex w-full h-full p-2 bg-${presentationSettings.backgroundColor}`}
      onPointerMove={(e) => {
        setIsPresentationSettingsIconShown(true);
      }}
    >
      {/* Hamburger Menu Icon */}
      {isPresentationSettingsIconShown && (
        <View className="absolute top-4 left-4 z-10 w-auto">
          <Pressable
            className="p-2 rounded-full w-auto h-auto"
            onPress={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
          >
            <Ionicons
              name="settings"
              size={30}
              className={`text-${presentationSettings.fontColor}`}
            />
          </Pressable>
          {isSettingsMenuOpen && <PresentationSettingsMenu />}
        </View>
      )}

      {/* Hymn Text Display */}
      <Pressable
        className="flex-1 justify-center items-center cursor-default"
        onPress={() => {
          setIsPresentationSettingsIconShown(false);
          setIsSettingsMenuOpen(false);
        }}
      >
        <Text
          className={`text-center text-4xl text-${presentationSettings.fontColor}`}
          style={{ fontFamily: "Amiri_400Regular" }}
        >
          {/* {verses[currentVerseIndex]} */}
          الوطن هو السماء
        </Text>
      </Pressable>
    </View>
  );
}