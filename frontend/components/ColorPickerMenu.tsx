import React from "react";
import { View, Text, Pressable } from "react-native";
import { isMobile } from "react-device-detect";
import useHymnosState from "../global";
import Ionicons from "@expo/vector-icons/Ionicons";
import HymnosText from "./HymnosText";

function ColorRow({
  color,
  onSelectColor,
  currentColor,
}: {
  color: string;
  onSelectColor: (color: string) => void;
  currentColor: string;
}) {
  return (
    <View className="flex flex-row gap-x-1 flex-wrap">
      {["100", "300", "500", "700", "900"].map((shade) => {
        const colorValue = `${color}-${shade}`;
        const isSelected = colorValue === currentColor;
        return (
          <View
            key={shade}
            className={`relative bg-${color}-${shade} w-5 h-5 rounded-md border-gray-700 border transition duration-100 ease-in-out ${
              isSelected ? "border-2 border-white" : "hover:scale-110"
            }`}
            onStartShouldSetResponder={() => true}
            onResponderRelease={() => onSelectColor(colorValue)}
          >
            {isSelected && (
              <Ionicons
                name="checkmark"
                size={14}
                color="white"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function ColorPickerMenu({
  onColorSelect,
  currentColor,
}: {
  onColorSelect: (color: string) => void;
  currentColor: string;
}) {
  const { setCurrentView, setActiveMenu } = useHymnosState();

  const handleBack = () => {
    setCurrentView("main");
    setActiveMenu(null);
  };

  return (
    <View
      className={`p-3 bg-slate-200 rounded-md space-y-3 ${
        isMobile ? "w-full max-w-[180px]" : "w-auto"
      }`}
    >
      <View className="flex-row items-center mb-2">
        <Pressable onPress={handleBack} className="mr-2">
          <Ionicons name="arrow-back" size={20} color="black" />
        </Pressable>
        <HymnosText className="font-medium">Select Color</HymnosText>
      </View>
      <ColorRow
        color="blue"
        onSelectColor={onColorSelect}
        currentColor={currentColor}
      />
      <ColorRow
        color="cyan"
        onSelectColor={onColorSelect}
        currentColor={currentColor}
      />
      <ColorRow
        color="green"
        onSelectColor={onColorSelect}
        currentColor={currentColor}
      />
      <ColorRow
        color="red"
        onSelectColor={onColorSelect}
        currentColor={currentColor}
      />
      <ColorRow
        color="yellow"
        onSelectColor={onColorSelect}
        currentColor={currentColor}
      />
      <ColorRow
        color="slate"
        onSelectColor={onColorSelect}
        currentColor={currentColor}
      />
      <ColorRow
        color="gray"
        onSelectColor={onColorSelect}
        currentColor={currentColor}
      />
    </View>
  );
}