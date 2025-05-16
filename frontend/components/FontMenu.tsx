import React from "react";
import { View, Text, Pressable } from "react-native";
import useHymnosState from "../global";
import Ionicons from "@expo/vector-icons/Ionicons";
import HymnosText from "./HymnosText";

interface FontMenuProps {
  onFontSelect: (font: string) => void;
}

function FontPreviewItem({
  fontName,
  previewText,
  fontFamily,
  onSelect,
}: {
  fontName: string;
  previewText: string;
  fontFamily: string;
  onSelect: (fontFamily: string) => void;
}) {
  return (
    <View
      className="p-2 hover:bg-slate-300 rounded-md flex-col"
      onStartShouldSetResponder={() => true}
      onResponderRelease={() => onSelect(fontFamily)}
    >
      <HymnosText className="text-sm">{fontName}</HymnosText>
      <Text style={{ fontFamily: fontFamily }} className="text-xl">
        {previewText}
      </Text>
    </View>
  );
}

export default function FontMenu({ onFontSelect }: FontMenuProps) {
  const { setCurrentView, setActiveMenu } = useHymnosState();

  const handleBack = () => {
    setCurrentView("main");
    setActiveMenu(null);
  };

  return (
    <View className="rounded-md bg-slate-200 p-2 flex-col gap-y-1 w-40">
      <View className="flex-row items-center mb-2">
        <Pressable onPress={handleBack} className="mr-2">
          <Ionicons name="arrow-back" size={20} color="black" />
        </Pressable>
        <HymnosText className="font-medium">Select Font</HymnosText>
      </View>
      <FontPreviewItem
        fontName="Amiri"
        previewText="تَوِّبْنِي فَأَتُوبَ"
        fontFamily="Amiri_400Regular"
        onSelect={() => onFontSelect("Amiri_400Regular")}
      />
      <FontPreviewItem
        fontName="Cairo"
        previewText="تَوِّبْنِي فَأَتُوبَ"
        fontFamily="Cairo_400Regular"
        onSelect={() => onFontSelect("Cairo_400Regular")} 
      />
      <FontPreviewItem
        fontName="Lateef"
        previewText="تَوِّبْنِي فَأَتُوبَ"
        fontFamily="Lateef_400Regular"
        onSelect={() => onFontSelect("Lateef_400Regular")} 
      />
      <FontPreviewItem
        fontName="Baloo Bhaijaan 2"
        previewText="تَوِّبْنِي فَأَتُوبَ"
        fontFamily="BalooBhaijaan2_400Regular"
        onSelect={() => onFontSelect("BalooBhaijaan2_400Regular")}
      />
    </View>
  );
}