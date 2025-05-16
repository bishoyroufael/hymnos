import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { ToastContainer } from 'react-toastify';
import ConfirmModal from "../../components/ConfirmModal";
import EditToolBox from "../../components/EditToolBox";
import EditableTextInput from "../../components/EditableTextInput";
import HymnosPageWrapper from "../../components/HymnosPageWrapper";
import Toolbox from "../../components/Toolbox";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { update_or_add_hymn } from "../../db/dexie";
import { Hymn } from "../../db/models";
import { emitError } from "../../db/utils";
import HymnosText from "../../components/HymnosText";

export default function HymnDetails() {
  const [hymn, setHymn] = useState<Hymn | null>({
                        title:" Untitled Hymn",
                        slides_order: [],
                        uuid: randomUUID(),
                        author: null,
                        composer: null
                    });
  const [isEditingHymn, setIsEditingHymn] = useState<boolean>(true);

  const handleInputChange = (key: string, value: string) => {
    setHymn(prev => ({ ...prev, [key]: value}))
  };

  const confirmModal = useConfirmModal();

  return (
    <HymnosPageWrapper>
        <View className="gap-y-4">
          <ConfirmModal visible={confirmModal.visible} onConfirm={confirmModal.onConfirm} onCancel={confirmModal.hide}/>
          {/* Hymn Pack Information */}
          <View className="gap-2">
            <View className="flex flex-row-reverse items-center gap-2 flex-wrap">
                <EditableTextInput
                    rtl
                    placeholder="اكتب اسم الترنيمه.." 
                    refKey={"title"}
                    value={hymn.title}
                    isEditing={isEditingHymn}
                    className={`flex-1 text-3xl font-semibold pt-2 pb-2 outline-none text-gray-800 ${isEditingHymn ? "animate-pulse" : ""}`} 
                    onUpdateText={handleInputChange}
                />
                <EditToolBox
                  hideThose="cancel delete"
                  submitIconClassName="text-green-400 hover:text-green-500 duration-100"
                  className="flex flex-row"
                  showOnlyIf={isEditingHymn}
                  submitEditCallback={()=>{
                    if (hymn.title.trim().length < 10) {
                      emitError("Hymn title should have more than 10 characters");
                      return;
                    }
                    update_or_add_hymn(hymn).then(()=>{
                      router.navigate(`/hymn/details?uuid=${hymn.uuid}`)
                    });
                  }}
                />
                <ToastContainer/>
                <Toolbox
                  editIconClassName="hover:text-green-600 text-green-500 duration-200"
                  shareIconClassName="hover:text-blue-600 text-blue-500 duration-200"
                  className="flex flex-row"
                  showOnlyIf={!isEditingHymn}
                  onEnableEdit={()=>{ setIsEditingHymn(true); }}
                  onShareCallback={()=>{}}
                />
            </View>
            <View className="flex flex-row-reverse gap-2">
                <HymnosText className="text-gray-800 font-medium">المؤلف:</HymnosText>
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
            <View className="flex flex-row-reverse gap-2">
                <HymnosText className="text-gray-800 font-medium">الملحن:</HymnosText>
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
          </View>
        </View>
    </HymnosPageWrapper>
  );
}
