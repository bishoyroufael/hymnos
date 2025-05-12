import React from "react"
import { Pressable, View } from "react-native"
import useHymnosState from "../global";
import Ionicons from "@expo/vector-icons/Ionicons";
import SlideSettingsMenu from "./SlideSettingsMenu";

export default function SlideSettingsIcon () {
  const {
    isSettingsMenuOpen,
    setIsSettingsMenuOpen,
    isPresentationSettingsIconShown,
    presentationSettings,
  } = useHymnosState();

  return (
      isPresentationSettingsIconShown && (
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
              <SlideSettingsMenu />
            </View>
          )}
        </View>
      )
  )
};

