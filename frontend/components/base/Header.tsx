import HymnosText from "@components/base/HymnosText";
import Menu from "@components/base/Menu";
import ToolBox from "@components/base/ToolBox";
import Feather from "@expo/vector-icons/Feather";
import { usePGliteContext } from "context/PGliteContext";
import { router } from "expo-router";
import useHymnosState from "global";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

export default function Header() {
  const [openMenu, setOpenMenu] = useState<"create" | "settings" | null>(null);
  const { db } = usePGliteContext();
  const importData = useHymnosState((state) => state.importUserData);
  return (
    <View
      style={{ direction: "rtl" }}
      className="z-20 w-10/12 self-center flex-row flex-none items-center justify-between p-4 border border-gray-300 shadow rounded-lg bg-slate-50 hover:bg-slate-100 duration-200 mt-2"
    >
      {/* Left: Menu */}
      <View className="flex-1 flex-row gap-4 items-center">
        <Pressable onPress={() => router.navigate("/")}>
          <Feather
            name="home"
            size={25}
            className="text-sky-700 hover:text-sky-800 duration-200"
          />
        </Pressable>
        <Pressable
          onPress={() =>
            setOpenMenu((prev) => (prev === "create" ? null : "create"))
          }
        >
          <Feather
            name={openMenu == "create" ? "x" : "edit"}
            size={25}
            className="text-sky-700 hover:text-sky-800 duration-200"
          />
        </Pressable>
        {openMenu == "create" && (
          <View
            className="absolute top-14 left-12 right-12 w-auto"
            style={{ direction: "rtl" }}
          >
            <Menu
              className="w-52 bg-slate-200 h-fit rounded-md p-2 gap-1 flex flex-col shadow"
              title="إنشاء"
              items={[
                {
                  title: "ترنيمة",
                  onPress: () => {
                    router.navigate("/hymn/create");
                  },
                  itemCustomView: <Feather name="music" size={20} />,
                },
                {
                  title: "مكتبة ترانيم",
                  onPress: () => {
                    router.navigate("/pack/create");
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
        <HymnosText className="text-lg font-light tracking-wide text-sky-800">
          ϩⲩⲙⲛⲟⲥ
        </HymnosText>
      </View>

      {/* Right: Hidden buttons with fixed size */}
      <View className="flex-1 flex-row gap-4 items-center justify-end">
        <ToolBox
          showOnlyIf={true}
          actions={[
            {
              key: "settings",
              iconName: openMenu == "settings" ? "x" : "settings",
              iconClassName: "text-sky-700 hover:text-sky-800 duration-200",
              onPress: () =>
                setOpenMenu((prev) =>
                  prev === "settings" ? null : "settings",
                ),
            },
          ]}
        />
        {openMenu == "settings" && (
          <View className="absolute top-16 w-auto" style={{ direction: "rtl" }}>
            <Menu
              className="w-52 bg-slate-200 h-fit rounded-md p-2 gap-1 flex flex-col shadow"
              title="إعدادات"
              items={[
                {
                  title: "رفع ترنيمه او مكتبه",
                  onPress: () => importData(db),
                  itemCustomView: <Feather name="upload" size={20} />,
                },
              ]}
            />
          </View>
        )}
      </View>
    </View>
  );
}
