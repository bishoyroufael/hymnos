import React, { useState } from "react";
import { View, Text, Pressable, SafeAreaView } from "react-native";
import ColorPickerMenu from "./ColorPickerMenu";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontMenu from "./FontMenu";

function MenuNestedItem({ title, nestedList }) {
  const [showNestedItem, setShowNestedItem] = useState(false);
  return (
    <Pressable
      className="flex-row"
      onPress={(e) => {
        setShowNestedItem(true);
      }}
      onHoverIn={(e) => {
        setShowNestedItem(true);
      }}
      onHoverOut={(e) => {
        setShowNestedItem(false);
      }}
    >
      <View className="p-2 hover:bg-slate-300 rounded-md flex-row items-center w-full">
        <Text>{title}</Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color="black"
          className="ml-auto"
        />
      </View>
      {showNestedItem && (
        <View className="absolute left-full pl-4">{nestedList}</View>
      )}
    </Pressable>
  );
}

export default function PresentationSettingsMenu() {
  return (
    <View className="rounded-md bg-slate-200 p-2 w-52">
      <MenuNestedItem
        title={"Background Color"}
        nestedList={<ColorPickerMenu type="background"/>}
      />
      <MenuNestedItem title={"Font Color"} nestedList={<ColorPickerMenu type="font"/>} />
      <MenuNestedItem title={"Font Family"} nestedList={<FontMenu />} />
    </View>
  );
}