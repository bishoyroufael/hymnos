import React, { useState } from "react";
import { View } from "react-native";

// https://stackoverflow.com/questions/71818458/why-wont-tailwind-find-my-dynamic-class

function ColorRow({
  color,
  onSelectColor,
}: {
  color: string;
  onSelectColor: (color: string) => void;
}) {
  return (
    <View className="flex flex-row gap-x-1">
      {["100", "300", "500", "700", "900"].map((shade) => (
        <View
          key={shade}
          className={`bg-${color}-${shade} w-5 h-5 rounded-md border-gray-700 border hover:scale-110 transition duration-100 ease-in-out`}
          onStartShouldSetResponder={() => true} // Enables interaction for View
          onResponderRelease={() => onSelectColor(`${color}-${shade}`)} // Handles color selection
        />
      ))}
    </View>
  );
}

export default function ColorPickerMenu({
  onColorSelect,
}: {
  onColorSelect: (color: string) => void;
}) {
  return (
    <View className="p-3 bg-slate-200 rounded-md space-y-3">
      <ColorRow color="blue" onSelectColor={onColorSelect} />
      <ColorRow color="cyan" onSelectColor={onColorSelect} />
      <ColorRow color="green" onSelectColor={onColorSelect} />
      <ColorRow color="red" onSelectColor={onColorSelect} />
      <ColorRow color="yellow" onSelectColor={onColorSelect} />
      <ColorRow color="slate" onSelectColor={onColorSelect} />
      <ColorRow color="gray" onSelectColor={onColorSelect} />
    </View>
  );
}
