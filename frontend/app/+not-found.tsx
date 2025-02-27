import { Link } from "expo-router"
import React from "react"
import { View, Text } from "react-native"

// We need a prettier component ;)
export default function NotFoundPage ({props}) {
  return (
    <View className="flex justify-center align-middle self-center h-full w-full">
        <Text className="text-center text-2xl">
            404 Not Found!
        </Text>
        <Text className="text-center text-xl">
            <Link href="/" className="underline text-blue-400">Home</Link>
        </Text>
    </View>
  )
};

