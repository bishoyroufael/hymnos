import HymnosPageWrapper from "@components/base/HymnosPageWrapper";
import ConfirmModal from "@components/base/ConfirmModal";
import EditableTextInput from "@components/base/EditableTextInput";
import ToolBox from "@components/base/ToolBox";
import HymnosText from "@components/base/HymnosText";
import { update_or_add_pack } from "@db/dexie";
import { HymnsPack } from "@db/models";
import { emitError } from "@utils/notification";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { useConfirmModal } from "@hooks/useConfirmModal";
import Feather from "@expo/vector-icons/Feather";

export default function HymnPack() {
  const [hymnPack, setHymnPack] = useState<HymnsPack | null>({
    title: "مكتبه ترانيم جديده",
    author: "Hymnos App",
    description: "",
    version: "1.0",
    hymns_uuid: [],
    uuid: randomUUID(),
  });

  const [isEditingPack, setIsEditingPack] = useState<boolean>(true);
  const confirmModal = useConfirmModal();
  const handleInputChange = (key: string, value: string) => {
    setHymnPack((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (hymnPack.title.trim().length < 10) {
      emitError("Hymn title should have more than 10 characters");
      return;
    }
    if (hymnPack.description.trim().length < 20) {
      emitError("Hymn description should have more than 10 characters");
      return;
    }
    if (hymnPack.author.trim().length < 10) {
      emitError("Hymn author should have more than 10 characters");
      return;
    }
    update_or_add_pack(hymnPack).then(() => {
      router.navigate(`/hymn/pack?uuid=${hymnPack.uuid}`);
    });
  };
  function handleShare(): void {
    throw new Error("Function not implemented.");
  }

  function handleOnEdit(): void {
    setIsEditingPack(true);
  }
  return (
    <HymnosPageWrapper>
      <View className="flex flex-grow gap-4 md:w-1/2 w-full self-center border-2 rounded-lg p-6 border-gray-300 shadow hover:border-gray-400 duration-200">
        {/* Hymn Pack Information */}
        <ConfirmModal
          visible={confirmModal.visible}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.hide}
        />

        {/* Title and Submit Icon */}
        <View className="flex flex-row-reverse items-center gap-2 flex-wrap">
          <Feather name="folder" size={30} className="text-gray-800" />
          <EditableTextInput
            rtl
            placeholder="اكتب اسم المكتبه.."
            refKey={"title"}
            value={hymnPack.title}
            isEditing={isEditingPack}
            className={`flex-1 max-w-full text-3xl font-semibold outline-none text-gray-800 ${isEditingPack ? "animate-pulse" : ""}`}
            onUpdateText={handleInputChange}
          />
          <ToolBox
            showOnlyIf={!isEditingPack}
            className="flex flex-row"
            actions={[
              {
                key: "share",
                iconName: "share-2",
                onPress: handleShare,
                iconClassName: "hover:text-blue-600 text-blue-500 duration-200",
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

        {/* Description of Pack */}
        <View className="flex flex-col gap-2">
          <View className="flex flex-row-reverse gap-2 items-center">
            <Feather name="edit-3" size={20} className="text-gray-800" />
            <HymnosText className="text-gray-800 font-medium">
              وصف المكتبه:
            </HymnosText>
          </View>
          <EditableTextInput
            rtl
            numberOfLines={5}
            placeholder="اكتب وصف المكتبه.."
            refKey={"description"}
            value={hymnPack.description}
            isEditing={isEditingPack}
            className={`flex-1 border border-gray-200 p-2 rounded-md outline-none text-gray-700 ${isEditingPack ? "animate-pulse" : ""}`}
            onUpdateText={handleInputChange}
            multiline
          />
        </View>

        {/* Author of Pack */}
        <View className="flex flex-row-reverse gap-2 items-center">
          <Feather name="user" size={20} className="text-gray-800" />
          <HymnosText className="text-gray-800 font-medium">المؤلف:</HymnosText>
          <EditableTextInput
            rtl
            placeholder="اكتب مؤلف المكتبه.."
            refKey={"author"}
            value={hymnPack.author}
            isEditing={isEditingPack}
            className={`flex-1 pt-2 pb-2 outline-none text-gray-500 ${isEditingPack ? "animate-pulse" : ""}`}
            onUpdateText={handleInputChange}
          />
        </View>

        <HymnosText className="text-gray-500">
          اصدار: {hymnPack.version}
        </HymnosText>
        <HymnosText className="text-gray-500">
          عدد الترانيم: {hymnPack.hymns_uuid.length}
        </HymnosText>

        <View className="mt-auto flex-row-reverse items-center gap-2">
          <View className="flex-1 bg-gray-200 h-0.5" />
          <ToolBox
            className="flex flex-row"
            showOnlyIf={isEditingPack}
            actions={[
              {
                key: "submit",
                iconName: "check-circle",
                iconSize: 35,
                iconClassName: "text-blue-400 hover:text-blue-500 duration-100",
                confirm: true,
                onPress: handleSubmit,
              },
            ]}
          />
        </View>
      </View>
    </HymnosPageWrapper>
  );
}
