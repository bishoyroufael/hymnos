import React, { ComponentProps } from "react"
import { Pressable, View, ViewProps } from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons";

interface ToolboxProps extends ViewProps {
  editIconClassName: string
  shareIconClassName: string
  showOnlyIf: boolean 
  onEnableEdit: () => void;
  onShareCallback: () => void;
}

export default function Toolbox ({editIconClassName, shareIconClassName, showOnlyIf, onEnableEdit, onShareCallback, ...rest}: ToolboxProps) {
  return (
      showOnlyIf && (
        <View {...rest}>
          <View>
              <Pressable
              className="p-2 rounded-full w-auto h-auto"
              onPress={(e) => {onShareCallback()}}
              >
                <Ionicons
                  name="share-social"
                  size={30}
                  className={shareIconClassName}
                  />
              </Pressable>
          </View>
          <View>
              <Pressable
              className="p-2 rounded-full w-auto h-auto"
              onPress={(e) => {onEnableEdit() }}
              >
                <Ionicons
                  name="create"
                  size={30}
                  className={editIconClassName}
                  />
              </Pressable>
          </View>
        </View>
      )
  )
};

