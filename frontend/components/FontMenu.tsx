import React from "react";
import { View, Text ,Pressable} from "react-native";

interface FontMenuProps {
  onFontSelect: (font: string) => void;
}

function FontPreviewItem({ fontName, previewText, fontFamily ,onSelect}: {
  fontName: string;
  previewText: string;
  fontFamily: string;
  onSelect: (fontFamily: string) => void;}) {
  return (
    <View
      className="p-2 hover:bg-slate-300 rounded-md flex-col"
      onStartShouldSetResponder={() => true} // Enables interaction for View
      onResponderRelease={() => onSelect(fontFamily)} // Handles font selection
    >
      <Text className="font-bold text-sm">{fontName}</Text>
      <Text style={{ fontFamily: fontFamily }} className="text-xl">
        {previewText}
      </Text>
    </View>
  );
}

export default function FontMenu({ onFontSelect }: FontMenuProps) {
  return (
    <View className="rounded-md bg-slate-200 p-2 flex-col gap-y-1 w-40">
      <FontPreviewItem
        fontName="Amiri"
        previewText="تَوِّبْنِي فَأَتُوبَ"
        fontFamily="Amiri_400Regular"
        onSelect={() => onFontSelect("Amiri_400Regular")}
      />
      <FontPreviewItem
        fontName="Rubik"
        previewText="تَوِّبْنِي فَأَتُوبَ"
        fontFamily="Rubik_400Regular"
        onSelect={() => onFontSelect("Rubik_400Regular")} 
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