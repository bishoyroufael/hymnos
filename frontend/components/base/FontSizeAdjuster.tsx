import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import useHymnosState from "../../global";
import HymnosText from "@components/base/HymnosText";

interface FontSizeAdjusterProps {
  onFontSizeChange?: (size: number) => void; // callback
}

const FontSizeAdjuster: React.FC<FontSizeAdjusterProps> = ({
  onFontSizeChange,
}) => {
  const { presentationSettings, setPresentationSettings } = useHymnosState();
  const [fontSize, setFontSize] = useState(presentationSettings.fontSize);

  const updateFontSize = (newSize: number) => {
    setFontSize(newSize);
    setPresentationSettings({ fontSize: newSize }); // Update Zustand global state
    if (onFontSizeChange) {
      onFontSizeChange(newSize); // Call optional callback if provided
    }
  };

  const handleIncrease = () => {
    updateFontSize(fontSize + 5);
  };

  const handleDecrease = () => {
    if (fontSize > 5) updateFontSize(fontSize - 5); // Prevent size <= 1
  };

  return (
    <View className="flex-row items-center space-x-2">
      <Pressable
        onPress={handleDecrease}
        className="px-2 py-1 bg-gray-300 rounded select-none"
      >
        <HymnosText>-</HymnosText>
      </Pressable>
      <HymnosText>{fontSize}</HymnosText>
      <Pressable
        onPress={handleIncrease}
        className="px-2 py-1 bg-gray-300 rounded select-none"
      >
        <HymnosText>+</HymnosText>
      </Pressable>
    </View>
  );
};

export default FontSizeAdjuster;
