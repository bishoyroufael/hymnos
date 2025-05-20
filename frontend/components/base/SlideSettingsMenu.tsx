import React from "react";
import { View, Text, Pressable, SafeAreaView } from "react-native";
import ColorPickerMenu from "./ColorPickerMenu";
import Feather from "@expo/vector-icons/Feather";
import FontMenu from "./FontMenu";
import FontSizeAdjuster from "./FontSizeAdjuster";
import useHymnosState from "../../global";
import HymnosText from "@components/base/HymnosText";

function MenuNestedItem({
  title,
  onToggle,
}: {
  title: string;
  onToggle: () => void;
}) {
  return (
    <View className="relative">
      <Pressable className="flex-row" onPress={() => onToggle()}>
        <View className="p-2 hover:bg-slate-300 rounded-md flex-row items-center w-full">
          <HymnosText>{title}</HymnosText>
          <Feather
            name="chevron-right"
            size={16}
            color="black"
            className="ml-auto"
          />
        </View>
      </Pressable>
    </View>
  );
}

export default function SlideSettingsMenu() {
  // Access global state updater from Zustand
  const {
    setPresentationSettings,
    activeMenu,
    setActiveMenu,
    currentView,
    setCurrentView,
    presentationSettings,
  } = useHymnosState();

  const handleToggleMenu = (menuTitle: string) => {
    setActiveMenu(menuTitle);
    setCurrentView("nested");
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

  if (currentView === "nested") {
    return (
      <View className="rounded-md bg-slate-200 p-2 w-52">
        {activeMenu === "Background Color" && (
          <ColorPickerMenu
            onColorSelect={handleBackgroundColorSelect}
            currentColor={presentationSettings.backgroundColor}
          />
        )}
        {activeMenu === "Font Color" && (
          <ColorPickerMenu
            onColorSelect={handleFontColorSelect}
            currentColor={presentationSettings.fontColor}
          />
        )}
        {activeMenu === "Font Family" && (
          <FontMenu onFontSelect={handleFontSelect} />
        )}
      </View>
    );
  }

  return (
    <View className="rounded-md bg-slate-200 p-2 w-52">
      <MenuNestedItem
        title="Background Color"
        onToggle={() => handleToggleMenu("Background Color")}
      />
      <MenuNestedItem
        title="Font Color"
        onToggle={() => handleToggleMenu("Font Color")}
      />
      <MenuNestedItem
        title="Font Family"
        onToggle={() => handleToggleMenu("Font Family")}
      />
      <View className="flex-row items-center justify-between">
        <HymnosText className="p-2">Font Size</HymnosText>
        <FontSizeAdjuster />
      </View>
    </View>
  );
}
