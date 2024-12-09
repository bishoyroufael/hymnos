import React, { useState } from "react";
import { View, Text, Pressable, SafeAreaView } from "react-native";
import ColorPickerMenu from "./ColorPickerMenu";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontMenu from "./FontMenu";
import FontSizeAdjuster from "./FontSizeAdjuster";
import useHymnosState from "../global";

function MenuNestedItem({ title, nestedList }: { title: string; nestedList: JSX.Element }) {
  const [showNestedItem, setShowNestedItem] = useState(false);
  return (
    <Pressable
      className="flex-row"
      onPress={(e) => {
        setShowNestedItem(!showNestedItem);
      }}
      onHoverIn={(e) => {
        setShowNestedItem(true);
      }}
      onHoverOut={(e) => {
        setShowNestedItem(false);
      }}
    >
      <View className="p-2 hover:bg-slate-300 rounded-md flex-row items-center w-full">
        <Text>{title}</Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color="black"
          className="ml-auto"
        />
      </View>
      {showNestedItem && (
        <View className="absolute left-full pl-4">{nestedList}</View>
      )}
    </Pressable>
  );
}

export default function PresentationSettingsMenu() {
  // Access global state updater from Zustand
  const { setPresentationSettings } = useHymnosState();
  const handleBackgroundColorSelect = (color: string) => 
    {
    setPresentationSettings({ backgroundColor: color }); // Update background color in global state
    };

  const handleFontColorSelect = (color: string) => 
    {
      setPresentationSettings({ fontColor: color }); // Update font color in global state
    };

    const handleFontSelect = (font: string) => {
      setPresentationSettings({ font }); // Update font in global state
    };

  return (
    <View className="rounded-md bg-slate-200 p-2 w-52">
      <MenuNestedItem
        title={"Background Color"}
        nestedList={<ColorPickerMenu onColorSelect={handleBackgroundColorSelect}/>}
      />
      <MenuNestedItem title={"Font Color"} nestedList={<ColorPickerMenu onColorSelect={handleFontColorSelect}/>} />
      <MenuNestedItem title={"Font Family"} nestedList={<FontMenu onFontSelect={handleFontSelect}/>} />
      <View className="flex-row items-center justify-between">
        <Text className="font">Font Size</Text>
        <FontSizeAdjuster />
      </View>
    </View>
  );
}