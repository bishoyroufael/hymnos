import HymnosText from "@components/base/HymnosText";
import Menu from "@components/base/Menu";
import ToolBox from "@components/base/ToolBox";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { HymnosDataExport } from "@utils/exporter";
import { emitError, emitInfo } from "@utils/notification";
import * as DocumentPicker from "expo-document-picker";
import { import_data } from "@db/dexie";
import useHymnosState from "global";

const handleImport = async (onImportCallback?: () => void) => {
  try {
    const doc = await DocumentPicker.getDocumentAsync({
      type: "application/json",
    });

    if (doc && doc.assets && doc.assets.length > 0) {
      const file = doc.assets[0].file;
      const content = await file.text();

      const hymnosData: HymnosDataExport = JSON.parse(content);
      await import_data(hymnosData);

      onImportCallback?.();

      emitInfo("تم اضافه المعلومات بنجاح!");
    }
  } catch (e) {
    emitError("Error occurred while importing: " + e);
  }
};

interface HeaderProps {
  onUploadDataCallback?: () => void;
}

export default function Header({ onUploadDataCallback }: HeaderProps) {
  const [openCreateMenu, setOpenCreateMenu] = useState(false);
  const [openSettingsMenu, setOpenSettingsMenu] = useState(false);
  const { searchDebounceDelay, setSearchDebounceDelay } = useHymnosState();

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
        <Pressable onPress={() => setOpenCreateMenu((prev) => !prev)}>
          <Feather
            name={!openCreateMenu ? "edit" : "x"}
            size={25}
            className="text-sky-700 hover:text-sky-800 duration-200"
          />
        </Pressable>
        {openCreateMenu && (
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
        <HymnosText className="text-lg font-light tracking-wide text-sky-800">
          ϩⲩⲙⲛⲟⲥ
        </HymnosText>
      </View>

      {/* Right: Hidden buttons with fixed size */}
      <View className="flex-1 flex-row gap-4 items-center justify-end">
        <ToolBox
          showOnlyIf={true}
          //   className="self-start border"
          actions={[
            {
              key: "settings",
              iconName: openSettingsMenu ? "x" : "settings",
              iconClassName: "text-sky-700 hover:text-sky-800 duration-200",
              onPress: () => {
                setOpenSettingsMenu((prev) => !prev);
              },
            },
          ]}
        />
        {openSettingsMenu && (
          <View className="absolute top-16 w-auto" style={{ direction: "rtl" }}>
            <Menu
              className="w-52 bg-slate-200 h-fit rounded-md p-2 gap-1 flex flex-col shadow"
              title="إعدادات"
              items={[
                {
                  title: "رفع ترنيمه او مكتبه",
                  onPress: () => handleImport(onUploadDataCallback),
                  itemCustomView: <Feather name="upload" size={20} />,
                },
                {
                  title: "وقت رد البحث",
                  itemCustomView: (
                    <TextInput
                      keyboardType="numeric"
                      maxLength={4}
                      className="border w-1/2 p-2 rounded-md border-gray-400 bg-gray-200"
                      value={searchDebounceDelay.toString()}
                      onChangeText={(v) => {
                        const parsed = parseInt(v.replace(/[^0-9]/g, ""));
                        if (Number.isNaN(parsed)) return;
                        setSearchDebounceDelay(parsed);
                      }}
                    />
                  ),
                },
              ]}
            />
          </View>
        )}
      </View>
    </View>
  );
}
