import HymnosText from "@components/base/HymnosText";
import { Link } from "expo-router";
import React from "react";
import { View } from "react-native";

// We need a prettier component ;)
export default function NotFoundPage({ props }) {
  return (
    <View className="flex justify-center align-middle self-center h-full w-full gap-4">
      <HymnosText className="text-center text-2xl">404 Not Found!</HymnosText>
      <HymnosText className="text-center text-xl">
        <Link href="/" className="underline text-blue-400">
          Home
        </Link>
      </HymnosText>
    </View>
  );
}
