import React from "react"
import { View } from "react-native"

// wrapper that is shared to style all pages in the app
export default function HymnosPageWrapper ({children}) {
  return (
    <View className="flex h-full w-full justify-center items-center">
      <View className="flex gap-y-4 p-4 w-3/4 h-full self-center justify-center">
        {children}
      </View>
    </View>
  )
};

