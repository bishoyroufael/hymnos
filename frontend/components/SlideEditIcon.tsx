import React from "react"
import { Pressable, View } from "react-native"
import useHymnosState from "../global";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function SlideEditIcon () {
  const {
    isPresentationSettingsIconShown,
    presentationSettings,
  } = useHymnosState();

  return (
      isPresentationSettingsIconShown && (
        <View className="absolute top-4 right-4 z-10 w-auto">
          <Pressable
            className="p-2 rounded-full w-auto h-auto"
            onPress={(e) => {

            }}
          >
            <Ionicons
              name="pencil"
              size={30}
              className={`text-${presentationSettings.fontColor}`}
            />
          </Pressable>
        </View>
      )
  )
};

