import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Keyboard } from "react-native";
import PresentationSettingsIcon from "../icons/PresentationSettingsIcon";
// import { useKeyboard } from '@react-native-community/hooks'; // optional library for handling keyboard events

interface Hymn {
  id: string;
  verses: string[];
  chorus: string;
}

export default function HymnPresentation() {
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [presentationSettings, setPresentationSettings] = useState({
    backgroundColor: "white",
    textColor: "black",
    fontSize: 32,
  });

  const hymn: Hymn = {
    id: "1",
    verses: [
      "Amazing grace! How sweet the sound That saved a wretch like me!",
      "I once was lost, but now am found; Was blind, but now I see.",
    ],
    chorus: "Praise the Lord! He is great and worthy of praise!",
  };

  const verses = [...hymn.verses, hymn.chorus]; // Combine verses and chorus for easier navigation

  // Handle keyboard arrow navigation
  useEffect(() => {
    const handleKeyPress = (event: any) => {
      if (event.key === "ArrowRight" && currentVerseIndex < verses.length - 1) {
        setCurrentVerseIndex(currentVerseIndex + 1);
      } else if (event.key === "ArrowLeft" && currentVerseIndex > 0) {
        setCurrentVerseIndex(currentVerseIndex - 1);
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [currentVerseIndex, verses.length]);

  // Auto-hide the menu after a few seconds
  useEffect(() => {
    if (showMenu) {
      const timer = setTimeout(() => setShowMenu(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showMenu]);

  return (
    <View
      className="flex w-full h-full p-2"
      style={{ backgroundColor: presentationSettings.backgroundColor }}
      onPointerMove={(e) => {
        setShowMenu(true);
      }}
    >
      {/* Hamburger Menu Icon */}
      {showMenu && (
        <TouchableOpacity
          className="absolute top-4 left-4 p-2 rounded-full w-12 h-12"
          onPress={() => setShowMenu(!showMenu)}
        >
          <PresentationSettingsIcon />
        </TouchableOpacity>
      )}

      {/* Hymn Text Display */}
      <TouchableOpacity
        className="flex-1 justify-center items-center"
        onPress={() => setShowMenu(true)}
      >
        <Text
          className="text-center"
          style={{
            color: presentationSettings.textColor,
            fontSize: presentationSettings.fontSize,
          }}
        >
          {verses[currentVerseIndex]}
        </Text>
      </TouchableOpacity>

      {/* Options Menu (appears on clicking hamburger icon) */}
      {/* {showMenu && (
                <View className="absolute bottom-0 left-0 right-0 bg-gray-800 p-4">
                    <Text className="text-white text-xl mb-4">Presentation Settings</Text>
                    <TouchableOpacity
                        className="mb-2"
                        onPress={() => setPresentationSettings({ ...presentationSettings, backgroundColor: 'black', textColor: 'white' })}
                    >
                        <Text className="text-white">Dark Mode</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="mb-2"
                        onPress={() => setPresentationSettings({ ...presentationSettings, fontSize: presentationSettings.fontSize + 4 })}
                    >
                        <Text className="text-white">Increase Font Size</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setPresentationSettings({ ...presentationSettings, fontSize: presentationSettings.fontSize - 4 })}
                    >
                        <Text className="text-white">Decrease Font Size</Text>
                    </TouchableOpacity>
                </View>
            )} */}
    </View>
  );
}
