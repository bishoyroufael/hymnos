import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react"
import { Pressable, View, ViewProps } from "react-native"
import useHymnosState from "../global";

interface PlusButtonProps extends ViewProps {
    showOnlyIf: boolean
    onPressCallback: () => void;
}

export default function PlusButton ({showOnlyIf, onPressCallback, ...rest}: PlusButtonProps) {
    return (
      showOnlyIf && (
        <View {...rest} >
            <Pressable
            className="p-2 rounded-full w-auto h-auto"
            onPress={(e) => {
                onPressCallback();
            }}
            >
            <Ionicons
                name="add"
                size={60}
                className={`text-gray-600`}
                />
            </Pressable>
        </View>
  )
)
};

