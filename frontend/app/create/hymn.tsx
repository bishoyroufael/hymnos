import ConfirmModal from "@components/base/ConfirmModal";
import ToolBox from "@components/base/ToolBox";
import EditableTextInput from "@components/base/EditableTextInput";
import HymnosPageWrapper from "@components/base/HymnosPageWrapper";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import HymnosText from "@components/base/HymnosText";
import { update_or_add_hymn } from "@db/dexie";
import { Hymn } from "@db/models";
import { emitError } from "@utils/notification";
import { useConfirmModal } from "@hooks/useConfirmModal";
import Feather from "@expo/vector-icons/Feather";

export default function HymnDetails() {
  const [hymn, setHymn] = useState<Hymn | null>({
    title: "ترنيمه جديده",
    slides_order: [],
    uuid: randomUUID(),
    author: null,
    composer: null,
  });
  const [isEditingHymn, setIsEditingHymn] = useState<boolean>(true);

  const handleInputChange = (key: string, value: string) => {
    setHymn((prev) => ({ ...prev, [key]: value }));
  };

  const confirmModal = useConfirmModal();

  const handleSubmit = () => {
    if (hymn.title.trim().length < 10) {
      emitError("Hymn title should have more than 10 characters");
      return;
    }
    update_or_add_hymn(hymn).then(() => {
      router.navigate(`/hymn/details?uuid=${hymn.uuid}`);
    });
  };
  function handleShare(): void {
    throw new Error("Function not implemented.");
  }

  function handleOnEdit(): void {
    setIsEditingHymn(true);
  }

  return (
    <HymnosPageWrapper>
      <View className="gap-y-4 md:w-1/2 w-full self-center border-2 rounded-lg p-6 border-gray-300 shadow hover:border-gray-400 duration-200">
        <ConfirmModal
          visible={confirmModal.visible}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.hide}
        />
        {/* Hymn Pack Information */}
        <View className="gap-2">
          <View className="flex flex-row-reverse items-center gap-2 flex-wrap">
            <Feather name="music" size={30} className="text-gray-800" />
            <EditableTextInput
              rtl
              placeholder="اكتب اسم الترنيمه.."
              refKey={"title"}
              value={hymn.title}
              isEditing={isEditingHymn}
              className={`flex-1 max-w-full text-3xl font-semibold pt-2 pb-2 outline-none text-gray-800 ${isEditingHymn ? "animate-pulse" : ""}`}
              onUpdateText={handleInputChange}
            />

            <ToolBox
              showOnlyIf={!isEditingHymn}
              className="flex flex-row"
              actions={[
                {
                  key: "share",
                  iconName: "share-2",
                  onPress: handleShare,
                  iconClassName:
                    "hover:text-blue-600 text-blue-500 duration-200",
                },
                {
                  key: "edit",
                  iconName: "edit",
                  onPress: handleOnEdit,
                  iconClassName:
                    "hover:text-green-600 text-green-500 duration-200",
                },
              ]}
            />
          </View>
          {/* Author */}
          <View className="flex flex-row-reverse gap-2 items-center">
            <Feather name="user" size={20} className="text-gray-800" />
            <HymnosText className="text-gray-800 font-medium">
              المؤلف:
            </HymnosText>
            <EditableTextInput
              rtl
              placeholder="اكتب اسم المؤلف.."
              refKey={"author"}
              value={hymn.author}
              isEditing={isEditingHymn}
              className={`text-gray-800 outline-none ${isEditingHymn ? "animate-pulse" : ""}`}
              valueIfEmpty="مجهول"
              onUpdateText={handleInputChange}
            />
          </View>
          {/* Composer */}
          <View className="flex flex-row-reverse gap-2 items-center">
            <Feather name="user" size={20} className="text-gray-800" />
            <HymnosText className="text-gray-800 font-medium">
              الملحن:
            </HymnosText>
            <EditableTextInput
              rtl
              placeholder="اكتب اسم الملحن.."
              refKey={"composer"}
              value={hymn.composer}
              isEditing={isEditingHymn}
              className={`text-gray-800 outline-none ${isEditingHymn ? "animate-pulse" : ""}`}
              valueIfEmpty="مجهول"
              onUpdateText={handleInputChange}
            />
          </View>
          <View className="flex flex-row-reverse items-center gap-2">
            <View className="flex-1 bg-gray-200 h-0.5" />
            <ToolBox
              className="flex flex-row"
              showOnlyIf={isEditingHymn}
              actions={[
                {
                  key: "submit",
                  iconName: "check-circle",
                  iconSize: 35,
                  iconClassName:
                    "text-blue-400 hover:text-blue-500 duration-100",
                  confirm: true,
                  onPress: handleSubmit,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </HymnosPageWrapper>
  );
}
