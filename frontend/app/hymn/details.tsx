import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { delete_hymn_by_uuid, get_hymn_by_uuid, get_slides_of_hymn, update_or_add_hymn, } from "../../db/dexie";
import { Hymn, Slide } from "../../db/models";
import HymnosPageWrapper from "../../components/HymnosPageWrapper";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import ConfirmModal from "../../components/ConfirmModal";
import EditableTextInput from "../../components/EditableTextInput";
import Toolbox from "../../components/Toolbox";
import EditToolBox from "../../components/EditToolBox";
import _ from "lodash";
import {Slide as SlideAnimation, ToastContainer, toast } from 'react-toastify';
import { emitError, emitInfo } from "../../db/utils";
import Ionicons from "@expo/vector-icons/Ionicons";
import HymnosText from "../../components/HymnosText";

export default function HymnDetails() {
  const { uuid } = useLocalSearchParams<{uuid: string }>();
  if (uuid == null){
    router.navigate("/notfound");
    return null;
  }
  
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [hymnBackup, setHymnBackup] = useState<Hymn | null>(null);
  const [slidesInHymn, setSlidesInHymn] = useState<Slide[]>([]);
  const [isEditingHymn, setIsEditingHymn] = useState<boolean>(false);

  const handleInputChange = (key: string, value: string) => {
    setHymn(prev => ({ ...prev, [key]: value}))
  };

  const confirmModal = useConfirmModal();


  // Fetch hymn pack details from backend
  useEffect(() => {
    get_hymn_by_uuid(uuid)
      .then((h) => {
        setHymn(h);
        setHymnBackup(_.cloneDeep(h))
        get_slides_of_hymn(uuid).then((slides) => {
          setSlidesInHymn(slides);
        });
      })
      .catch((e) => { console.log(e); router.navigate("/notfound"); });
  }, []);


  if (!hymn) {
    return (
      <View className="flex-1 items-center justify-center">
        <HymnosText>Loading...</HymnosText>
      </View>
    );
  }


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
                  deleteIconClassName="text-red-500 hover:text-red-600 duration-100"
                  submitIconClassName="text-green-400 hover:text-green-500 duration-100"
                  cancelIconClassName="text-red-400 hover:text-red-500 duration-100"
                  className="flex flex-row"
                  showOnlyIf={isEditingHymn}
                  cancelEditCallback={()=>{setHymn(_.cloneDeep(hymnBackup)); setIsEditingHymn(false);}}
                  deleteCallback={()=>{
                    delete_hymn_by_uuid(uuid).then(()=>{
                      setIsEditingHymn(false);
                      emitInfo("Hymn was deleted! Returning to home page..", ()=>router.navigate("/"))
                    });
                  }}
                  submitEditCallback={()=>{
                    if (hymn.title.trim().length < 10) {
                      emitError("Hymn title should have more than 10 characters");
                      return;
                    }
                    update_or_add_hymn(hymn).then(()=>{
                      setIsEditingHymn(false);
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
          {/* Hymn Titles */}
          <View className="justify-center gap-y-4">
            <HymnosText className="text-2xl font-semibold text-gray-800">كلام الترنيمه</HymnosText>
             {slidesInHymn.length != 0 ?  
            <FlatList
            className="h-[60vh]"
            data={slidesInHymn}
            keyExtractor={(item) => item.uuid}
            contentContainerClassName="gap-y-2"
            renderItem={({ item }) => (
              <View className={`border-2 border-gray-200 flex flex-row w-full justify-center items-center p-1 gap-1 bg-gray-100 rounded-lg `}>
                  <Pressable disabled={isEditingHymn} className="p-4 rounded-lg flex-1" onPress={()=>{router.navigate(`/hymn/presentation?uuid=${uuid}`)}}>
                    <HymnosText className={`whitespace-pre-line text-2xl text-center ${isEditingHymn ? "text-gray-500" : "text-gray-800"}`}>{item.lines.join("\n")}</HymnosText>
                  </Pressable>
                </View>
              )}
              /> : 
                <Pressable onPress={()=>router.navigate(`/hymn/presentation?uuid=${hymn.uuid}`)} className="h-[60vh] flex justify-center self-center bg-gray-100 rounded-lg hover:bg-gray-200 w-full duration-100">
                  <HymnosText className="text-3xl text-center text-gray-800">اضف كلمات الترنيمه</HymnosText>
                  <Ionicons name="add" size={40} className="self-center text-gray-800"/>
                </Pressable>
            }

          </View>
        </View>
    </HymnosPageWrapper>
  );
}
