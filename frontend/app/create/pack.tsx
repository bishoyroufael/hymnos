import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { ToastContainer } from "react-toastify";
import ConfirmModal from "../../components/ConfirmModal";
import EditableTextInput from "../../components/EditableTextInput";
import EditToolBox from "../../components/EditToolBox";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import HymnosPageWrapper from "../../components/HymnosPageWrapper";
import Toolbox from "../../components/Toolbox";
import { update_or_add_pack } from "../../db/dexie";
import { HymnsPack } from "../../db/models";
import { emitError } from "../../db/utils";
import HymnosText from "../../components/HymnosText";

export default function HymnPack() {
  // const [searchQuery, setSearchQuery] = useState("");
  const [hymnPack, setHymnPack] = useState<HymnsPack | null>({
                                                title: "New Untitled Pack", 
                                                author: "Hymnos App", 
                                                description:"Empty Description of New Untitled Pack", 
                                                version: "1.0", 
                                                hymns_uuid:[], 
                                                uuid: randomUUID() });
  const [isEditingPack, setIsEditingPack] = useState<boolean>(true);
  const confirmModal = useConfirmModal();
  const handleInputChange = (key: string, value: string) => {
    setHymnPack(prev => ({ ...prev, [key]: value}))
  };
  return (
    <HymnosPageWrapper>
          {/* Hymn Pack Information */}
          <View className="justify-center">
            <ConfirmModal visible={confirmModal.visible} onConfirm={confirmModal.onConfirm} onCancel={confirmModal.hide}/>
            <View className="flex flex-row items-center gap-2 flex-wrap">
              <EditableTextInput
                    placeholder="اكتب اسم المكتبه.." 
                    refKey={"title"}
                    value={hymnPack.title}
                    isEditing={isEditingPack}
                    className={`flex-1 text-3xl font-semibold pt-2 pb-2 outline-none text-gray-800 ${isEditingPack ? "animate-pulse" : ""}`} 
                    onUpdateText={handleInputChange}
              />
                  <EditToolBox 
                    hideThose="delete cancel"
                    submitIconClassName="text-green-400 hover:text-green-500 duration-100"
                    className="flex flex-row"
                    showOnlyIf={isEditingPack}
                    submitEditCallback={()=>{
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
                      update_or_add_pack(hymnPack).then(()=>{
                        router.navigate(`/hymn/pack?uuid=${hymnPack.uuid}`)
                      });
                    }}
                  />
                  <ToastContainer/>
                  <Toolbox
                    editIconClassName="hover:text-green-600 text-green-500 duration-200"
                    shareIconClassName="hover:text-blue-600 text-blue-500 duration-200"
                    className="flex flex-row"
                    showOnlyIf={!isEditingPack}
                    onEnableEdit={()=>{setIsEditingPack(true); }}
                    onShareCallback={()=>{}}
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
