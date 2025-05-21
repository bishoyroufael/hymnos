import HymnosText from "@components/base/HymnosText";
import Menu from "@components/base/Menu";
import ToolBox from "@components/base/ToolBox";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { ToastContainer } from "react-toastify";

function Header() {
  const [openMenu, setOpenMenu] = useState(false);
  return (
    <View
      style={{ direction: "rtl" }}
      className="z-10 w-10/12 self-center flex-row items-center justify-between p-4 border border-gray-300 shadow rounded-lg bg-slate-50 hover:bg-slate-100 duration-200 mt-2"
    >
      {/* Left: Menu */}
      <View className="flex-1 flex-row gap-4 items-center">
        <Pressable onPress={() => router.navigate("/")}>
          {/* <HymnosText className="text-sky-700 hover:text-sky-800 duration-200">
            Home
          </HymnosText> */}
          <Feather
            name="home"
            size={25}
            className="text-sky-700 hover:text-sky-800 duration-200"
          />
        </Pressable>
        <Pressable onPress={() => setOpenMenu((prev) => !prev)}>
          {/* <HymnosText className="text-sky-700 hover:text-sky-800 duration-200">
            Create
          </HymnosText> */}
          <Feather
            name={!openMenu ? "edit" : "x"}
            size={25}
            className="text-sky-700 hover:text-sky-800 duration-200"
          />
        </Pressable>
        {openMenu && (
          <View
            className="absolute top-16 left-12 right-12 w-auto"
            style={{ direction: "rtl" }}
          >
            <Menu
              className="w-52 bg-slate-200 h-fit rounded-md p-2 gap-1 flex flex-col shadow"
              title="إنشاء"
              items={[
                {
                  title: "ترنيمة",
                  onPress: () => {
                    router.navigate("/create/hymn");
                  },
                  itemCustomView: <Feather name="music" size={20} />,
                },
                {
                  title: "مكتبة ترانيم",
                  onPress: () => {
                    router.navigate("/create/pack");
                  },
                  itemCustomView: <Feather name="folder" size={20} />,
                },
              ]}
            />
          </View>
        )}
      </View>

      {/* Center: Title */}
      <View className="w-1/3 items-center">
        <HymnosText className="text-2xl font-light tracking-wide text-sky-800">
          ϩⲩⲙⲛⲟⲥ
        </HymnosText>
      </View>

      {/* Right: Hidden buttons with fixed size */}
      <View className="flex-1 flex-row justify-end">
        <ToolBox
          showOnlyIf={true}
          actions={[
            {
              key: "settings",
              iconName: "settings",
              iconClassName: "text-sky-700 hover:text-sky-800 duration-200",
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
