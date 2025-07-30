import Logo from "@components/base/Logo";
import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

interface LoaderProps {
  size?: number;
  message?: string;
  progressComponent?: React.ReactNode;
}

export default function Loader({ message, progressComponent }: LoaderProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4">
      <View>
        <Logo isPulsing={true} />
      </View>
      {message && <Text className="animate-pulse">{message}</Text>}
      <View className="w-1/6">{progressComponent}</View>
    </View>
  );
}
