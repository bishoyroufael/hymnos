import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { View } from "react-native";

export default function Loader() {
  return (
    <View className="flex-1 items-center justify-center">
      <View className="animate-pulse">
        <Feather name="loader" size={30} className={"text-gray-800"} />
      </View>
    </View>
  );
}
