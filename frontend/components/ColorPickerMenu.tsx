// https://stackoverflow.com/questions/71818458/why-wont-tailwind-find-my-dynamic-class
import React from "react";
import { View, Text, Pressable } from "react-native";
import { isMobile } from "react-device-detect";
import useHymnosState from "../global";
import Ionicons from "@expo/vector-icons/Ionicons";

function ColorRow({
  color,
  onSelectColor,
}: {
  color: string;
  onSelectColor: (color: string) => void;
}) {
  return (
    <View className="flex flex-row gap-x-1 flex-wrap">
      {["100", "300", "500", "700", "900"].map((shade) => (
        <View
          key={shade}
          className={`bg-${color}-${shade} w-5 h-5 rounded-md border-gray-700 border hover:scale-110 transition duration-100 ease-in-out`}
          onStartShouldSetResponder={() => true}
          onResponderRelease={() => onSelectColor(`${color}-${shade}`)}
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
        <Text className="font-bold">Select Color</Text>
      </View>
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