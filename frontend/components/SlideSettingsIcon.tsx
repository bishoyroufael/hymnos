import React from "react"
import { Pressable, View, ViewProps } from "react-native"
import useHymnosState from "../global";
import Ionicons from "@expo/vector-icons/Ionicons";
import SlideSettingsMenu from "./SlideSettingsMenu";

interface SlideSettingsIconProps extends ViewProps {
  showOnlyIf: boolean
  shouldOpenMenu: boolean
  iconClassName: string 
  onPressCallBack: ()=>void
}

export default function SlideSettingsIcon ({showOnlyIf, shouldOpenMenu, iconClassName, onPressCallBack, ...rest} : SlideSettingsIconProps) {
  return (
      showOnlyIf && (
        <View {...rest}>
          <Pressable
            className="p-2 rounded-full w-auto h-auto"
            onPress={(e) => {
              e.stopPropagation(); // Prevent hiding on menu interaction
              onPressCallBack();
            }}
          >
            <Ionicons
              name="settings"
              size={30}
              className={iconClassName}
            />
          </Pressable>

          {/* This should be abstracted and a menu component should be passed from the parent element*/}
          {/* Settings Menu */}
          {shouldOpenMenu && (
            <View
              onStartShouldSetResponder={() => true} // Capture touch events for menu
              onTouchStart={(e) => {
                e.stopPropagation(); // Stop propagation to avoid closing
                e.preventDefault(); // Prevent closing the menu when interacting
              }}
            >
              <SlideSettingsMenu />
            </View>
          )}
        </View>
      )
  )
};

