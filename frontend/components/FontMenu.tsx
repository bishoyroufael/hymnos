import React from "react";
import { View, Text } from "react-native";

function FontPreviewItem({ fontName, previewText, fontFamily }) {
  return (
    <View className="p-2 hover:bg-slate-300 rounded-md flex-col">
      <Text className="font-bold text-sm">{fontName}</Text>
      <Text style={{ fontFamily: fontFamily }} className="text-xl">
        {previewText}
      </Text>
    </View>
  );
}

export default function FontMenu() {
  return (
    <View className="rounded-md bg-slate-200 p-2 flex-col gap-y-1 w-40">
      <FontPreviewItem
        fontName="Amiri"
        previewText="تَوِّبْنِي فَأَتُوبَ"
        fontFamily="Amiri_400Regular"
      />
      <FontPreviewItem
        fontName="Rubik"
        previewText="تَوِّبْنِي فَأَتُوبَ"
        fontFamily="Rubik_400Regular"
      />
      <FontPreviewItem
        fontName="Baloo Bhaijaan 2"
        previewText="تَوِّبْنِي فَأَتُوبَ"
        fontFamily="BalooBhaijaan2_400Regular"
      />
    </View>
  );
}
