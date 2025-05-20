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

export default function HymnPack() {
  // const [searchQuery, setSearchQuery] = useState("");
  const [hymnPack, setHymnPack] = useState<HymnsPack | null>({
    title: "New Untitled Pack",
    author: "Hymnos App",
    description: "Empty Description of New Untitled Pack",
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
      {/* Hymn Pack Information */}
      <View className="justify-center">
        <ConfirmModal
          visible={confirmModal.visible}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.hide}
        />
        <View className="flex flex-row items-center gap-2 flex-wrap">
          <EditableTextInput
            placeholder="اكتب اسم المكتبه.."
            refKey={"title"}
            value={hymnPack.title}
            isEditing={isEditingPack}
            className={`flex-1 text-3xl font-semibold pt-2 pb-2 outline-none text-gray-800 ${isEditingPack ? "animate-pulse" : ""}`}
            onUpdateText={handleInputChange}
          />

          <ToolBox
            className="flex flex-row"
            showOnlyIf={isEditingPack}
            actions={[
              {
                key: "submit",
                iconName: "check",
                iconClassName:
                  "text-green-400 hover:text-green-500 duration-100",
                confirm: true,
                onPress: handleSubmit,
              },
            ]}
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
        <EditableTextInput
          placeholder="اكتب وصف المكتبه.."
          refKey={"description"}
          value={hymnPack.description}
          isEditing={isEditingPack}
          className={`flex-1 pt-2 pb-2 outline-none text-gray-700 ${isEditingPack ? "animate-pulse" : ""}`}
          onUpdateText={handleInputChange}
        />

        <View className="flex flex-row-reverse gap-2 items-center">
          <HymnosText className="text-gray-800 font-medium">المؤلف:</HymnosText>
          <EditableTextInput
            placeholder="اكتب مؤلف المكتبه.."
            refKey={"author"}
            value={hymnPack.author}
            isEditing={isEditingPack}
            className={`flex-1 pt-2 pb-2 outline-none text-gray-500 ${isEditingPack ? "animate-pulse" : ""}`}
            onUpdateText={handleInputChange}
          />
        </View>
        <HymnosText className="text-gray-500">
          Version: {hymnPack.version}
        </HymnosText>
        <HymnosText className="text-gray-500">
          Number of Hymns: {hymnPack.hymns_uuid.length}
        </HymnosText>
      </View>
    </HymnosPageWrapper>
  );
}
