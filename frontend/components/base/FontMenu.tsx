import HymnosText from "@components/base/HymnosText";
import Menu from "@components/base/Menu";
import React from "react";
import { Pressable, Text } from "react-native";

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
    <Pressable
      className="p-2 hover:bg-slate-300 rounded-md flex-col duration-200"
      onStartShouldSetResponder={() => true}
      onPress={() => onSelect(fontFamily)}
    >
      <HymnosText className="text-sm">{fontName}</HymnosText>
      <Text style={{ fontFamily: fontFamily }} className="text-xl">
        {previewText}
      </Text>
    </Pressable>
  );
}

export default function FontMenu({ onFontSelect }: FontMenuProps) {
  return (
    <Menu
      customView={
        <>
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
        </>
      }
    />
  );
}
