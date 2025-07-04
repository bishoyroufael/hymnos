import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

interface LoaderProps {
  size?: number;
  message?: string;
  progressComponent?: React.ReactNode;
}

export default function Loader({
  size,
  message,
  progressComponent,
}: LoaderProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4">
      <View>
        {/* <Feather name="loader" size={size || 30} className={"text-gray-800"} /> */}
        <ActivityIndicator size={size || 30} color="#1f2937" />
      </View>
      {message && <Text className="animate-pulse">{message}</Text>}
      <View className="w-1/2">{progressComponent}</View>
    </View>
  );
}
