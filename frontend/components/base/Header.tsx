import HymnosText from "@components/base/HymnosText";
import Menu from "@components/base/Menu";
import Feather from "@expo/vector-icons/Feather";
import { usePGliteContext } from "context/PGliteContext";
import { router } from "expo-router";
import useHymnosState from "global";
import React, { useCallback, useRef, useState } from "react";
import { Pressable, View } from "react-native";

export default function Header() {
  const [openMenu, setOpenMenu] = useState<"create" | "settings" | null>(null);
  const { db } = usePGliteContext();
  const importData = useHymnosState((state) => state.importUserData);

  const headerRef = useRef(null);
  const onBlur = useCallback((event) => {
    // Check if the new focus target is within the search container
    if (headerRef.current?.contains(event.relatedTarget)) {
      return; // Don't hide if focus is moving within search area
    }
    setOpenMenu(null);
  }, []);
  return (
    <View
      style={{ direction: "rtl" }}
      className="z-20 w-10/12 self-center flex-col flex-none items-center justify-between p-4 mt-2 gap-4 group"
      ref={headerRef}
    >
      <View className="flex flex-row justify-between items-center self-center w-full">
        {/* Left: Menu */}
        <View className="flex-1 flex-row gap-4 items-center">
          <Pressable onPress={() => router.navigate("/")}>
            <Feather
              name="home"
              size={25}
              className="text-gray-700 hover:text-gray-800 duration-200"
            />
          </Pressable>
          <Pressable
            onPress={() =>
              setOpenMenu((prev) => (prev === "create" ? null : "create"))
            }
            onBlur={onBlur}
          >
            <Feather
              name={openMenu == "create" ? "x" : "edit"}
              size={25}
              className="text-gray-700 hover:text-gray-800 duration-200"
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
                      setOpenMenu(null);
                    },
                    itemCustomView: <Feather name="music" size={20} />,
                  },
                  {
                    title: "مكتبة",
                    onPress: () => {
                      router.navigate("/pack/create");
                      setOpenMenu(null);
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
          <HymnosText className="text-lg font-light tracking-wide text-gray-800">
            ϩⲩⲙⲛⲟⲥ
          </HymnosText>
        </View>

        {/* Right: Hidden buttons with fixed size */}
        <View className="flex-1 flex-row gap-4 items-center justify-end">
          <Pressable
            onPress={() =>
              setOpenMenu((prev) => (prev === "settings" ? null : "settings"))
            }
            onBlur={onBlur}
          >
            <Feather
              name={openMenu == "settings" ? "x" : "settings"}
              size={25}
              className="text-gray-700 hover:text-gray-800 duration-200"
            />
          </Pressable>

          {openMenu == "settings" && (
            <View
              className="absolute top-16 w-auto"
              style={{ direction: "rtl" }}
            >
              <Menu
                className="w-52 bg-slate-200 h-fit rounded-md p-2 gap-1 flex flex-col shadow"
                title="إعدادات"
                items={[
                  {
                    title: "رفع ترنيمه او مكتبه",
                    onPress: () => {
                      importData(db);
                      setOpenMenu(null);
                    },
                    itemCustomView: <Feather name="upload" size={20} />,
                  },
                  {
                    title: `الإصدار: ${process.env.EXPO_PUBLIC_GIT_HASH}`,
                  },
                ]}
              />
            </View>
          )}
        </View>
      </View>
      <View className="border border-gray-700 w-full opacity-0 group-hover:opacity-100 duration-200"></View>
    </View>
  );
}
