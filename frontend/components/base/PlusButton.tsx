import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { Pressable, View, ViewProps } from "react-native";

interface PlusButtonProps extends ViewProps {
  showOnlyIf: boolean;
  onPressCallback: () => void;
}

export default function PlusButton({
  showOnlyIf,
  onPressCallback,
  ...rest
}: PlusButtonProps) {
  return (
    showOnlyIf && (
      <View {...rest}>
        <Pressable
          className="p-2 rounded-full w-auto h-auto"
          onPress={(e) => {
            onPressCallback();
          }}
        >
          <Feather name="plus" size={60} className={`text-gray-600`} />
        </Pressable>
      </View>
    )
  );
}
