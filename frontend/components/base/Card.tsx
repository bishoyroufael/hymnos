import HymnosText from "@components/base/HymnosText";
import React from "react";
import { Pressable, PressableProps, View } from "react-native";

interface CardProps extends PressableProps {
  title?: string;
  description?: string;
  onPressCallback?: () => void;
  isSkeleton?: boolean;
}

export default function Card({
  title,
  description,
  onPressCallback,
  isSkeleton,
  ...rest
}: CardProps) {
  return (
    <Pressable
      {...rest}
      onPress={() => onPressCallback()}
      className={`border-2 border-gray-200 p-4 bg-gray-100 ${!isSkeleton ? "hover:bg-gray-200 hover:border-gray-300 duration-100 " : ""}rounded-lg w-48 h-28 justify-center`}
    >
      {isSkeleton ? (
        <View className="animate-pulse w-full h-full space-y-2 justify-center">
          <View className="w-full bg-gray-300 h-6 rounded-md" />
          <View className="w-full bg-gray-300 h-2 rounded-lg" />
          <View className="w-full bg-gray-300 h-2 rounded-lg" />
          <View className="w-full bg-gray-300 h-2 rounded-lg" />
        </View>
      ) : (
        <>
          <HymnosText className="font-medium text-gray-800 line-clamp-2">
            {title}
          </HymnosText>
          <HymnosText className="text-gray-600 mt-2 whitespace-pre-line line-clamp-3">
            {description}
          </HymnosText>
        </>
      )}
    </Pressable>
  );
}

// className="border-2 border-gray-200 p-4 bg-gray-100 rounded-lg w-48 mr-2"
