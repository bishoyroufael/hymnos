import Menu from "@components/base/Menu";
import Feather from "@expo/vector-icons/Feather";
import useHymnosState from "global";
import React, { useEffect } from "react";
import { isMobile } from "react-device-detect";
import { Pressable, View } from "react-native";

function ColorRow({
  color,
  onSelectColor,
  currentColor,
}: {
  color: string;
  onSelectColor: (color: string) => void;
  currentColor: string;
}) {
  // Define shades based on view type

  // const { setPresentationSettings, presentationSettings } = useHymnosState();

  const shades = isMobile
    ? ["100", "500", "900"] // Mobile view: 1st, 3rd, 5th shades (3 swatches)
    : ["100", "300", "500", "700", "900"]; // Default/web view: all shades (5 swatches)

  // Set cell size based on view type for better touch accessibility

  const cellSize = isMobile ? "w-14 h-14" : "w-8 h-8";

  return (
    <View className="flex flex-row gap-1 mb-1 justify-center">
      {/* Removed flex-wrap to ensure swatches stay in one line */}
      {/* gap-x-1 sets 4px gaps between swatches */}
      {/* mb-1 sets 4px margin-bottom between rows */}
      {shades.map((shade) => {
        const colorValue = `${color}-${shade}`;
        const isSelected = colorValue === currentColor;

        return (
          <Pressable
            key={shade}
            className={`relative bg-${color}-${shade} ${cellSize} rounded-md border-gray-700 border transition duration-100 ease-in-out ${
              isSelected ? "border-2 border-black scale-90" : ""
            }`}
            onPress={() => {
              onSelectColor(colorValue);
            }}
          >
            {isSelected && (
              <Feather
                name="check"
                size={20}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-black"
              />
              // Displays a checkmark when the color is selected
            )}
          </Pressable>
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
  // Define colors based on mobile view
  const colors = isMobile
    ? ["blue", "green", "yellow", "slate"] // Mobile view: 1st, 3rd, 5th, 7th rows
    : ["blue", "cyan", "green", "red", "yellow", "gray", "slate"]; // Default view: all rows
  // console.log("CURRENT COLOR COLOR PICKER MENU:", currentColor);
  return (
    <Menu
      customView={
        <View>
          {colors.map((color) => (
            <ColorRow
              key={color}
              color={color}
              onSelectColor={onColorSelect}
              currentColor={currentColor}
            />
          ))}
        </View>
      }
    />
  );
}
