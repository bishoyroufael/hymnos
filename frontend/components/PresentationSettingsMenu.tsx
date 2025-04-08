import React from "react";
import { View, Text, Pressable, SafeAreaView } from "react-native";
import ColorPickerMenu from "./ColorPickerMenu";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontMenu from "./FontMenu";
import FontSizeAdjuster from "./FontSizeAdjuster";
import useHymnosState from "../global";
import { isMobile } from "react-device-detect";

function MenuNestedItem({
  title,
  nestedList,
  isActive,
  onToggle,
}: {
  title: string;
  nestedList: JSX.Element;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="relative">
      <Pressable
        className="flex-row"
        onPress={() => onToggle()} // Use onPress for both mobile and desktop
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
      </Pressable>
      {isActive && (
        <View className="absolute left-full pl-4">{nestedList}</View>
      )}
    </View>
  );
}

export default function PresentationSettingsMenu() {
  const { setPresentationSettings, activeMenu, setActiveMenu } = useHymnosState(); 
  const handleToggleMenu = (menuTitle: string) => {
    // If the same menu is clicked, close it; otherwise, open the new one
    setActiveMenu(activeMenu === menuTitle ? null : menuTitle);
  };

  const handleBackgroundColorSelect = (color: string) => {
    setPresentationSettings({ backgroundColor: color });
  };

  const handleFontColorSelect = (color: string) => {
    setPresentationSettings({ fontColor: color });
  };

  const handleFontSelect = (font: string) => {
    setPresentationSettings({ font });
  };

  return (
    <View className="rounded-md bg-slate-200 p-2 w-52">
      <MenuNestedItem
        title="Background Color"
        nestedList={<ColorPickerMenu onColorSelect={handleBackgroundColorSelect} />}
        isActive={activeMenu === "Background Color"}
        onToggle={() => handleToggleMenu("Background Color")}
      />
      <MenuNestedItem
        title="Font Color"
        nestedList={<ColorPickerMenu onColorSelect={handleFontColorSelect} />}
        isActive={activeMenu === "Font Color"}
        onToggle={() => handleToggleMenu("Font Color")}
      />
      <MenuNestedItem
        title="Font Family"
        nestedList={<FontMenu onFontSelect={handleFontSelect} />}
        isActive={activeMenu === "Font Family"}
        onToggle={() => handleToggleMenu("Font Family")}
      />
      <View className="flex-row items-center justify-between">
        <Text className="font p-2">Font Size</Text>
        <FontSizeAdjuster />
      </View>
    </View>
  );
}