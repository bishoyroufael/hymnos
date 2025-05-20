import HymnosText from "@components/base/HymnosText";
import ToolBox from "@components/base/ToolBox";
import React from "react";
import { Image, Pressable, View } from "react-native";
import { ToastContainer } from "react-toastify";

function Header() {
  return (
    <View className="w-10/12 self-center flex-row items-center justify-between p-4 border border-gray-300 shadow rounded-lg bg-slate-50 hover:bg-slate-100 duration-200 mt-2">
      {/* Left: Menu */}
      <View className="flex-1 flex-row gap-4">
        <Pressable>
          <HymnosText className="text-sky-700 hover:text-sky-800 duration-200">
            Home
          </HymnosText>
        </Pressable>
        <Pressable>
          <HymnosText className="text-sky-700 hover:text-sky-800 duration-200">
            Create
          </HymnosText>
        </Pressable>
      </View>

      {/* Center: Title */}
      <View className="w-1/3 items-center">
        <HymnosText className="text-2xl font-light tracking-wide text-sky-800">
          ϩⲩⲙⲛⲟⲥ
        </HymnosText>
      </View>

      {/* Right: Hidden buttons with fixed size */}
      <View className="flex-1">
        <ToolBox
          showOnlyIf={true}
          actions={[
            {
              key: "settings",
              iconName: "settings",
              iconClassName:
                "text-sky-700 hover:text-sky-800 duration-200 text-end",
              onPress: () => {},
            },
          ]}
        />
      </View>
    </View>
  );
}

// wrapper that is shared to style all pages in the app
export default function HymnosPageWrapper({ children }) {
  return (
    <>
      <Header />
      <View className="flex h-full w-full justify-center items-center">
        <ToastContainer />
        <View className="flex gap-y-4 p-4 h-full self-center justify-center w-10/12">
          {children}
        </View>
      </View>
    </>
  );
}
