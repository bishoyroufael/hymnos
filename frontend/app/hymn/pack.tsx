import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, FlatList, ScrollView, Pressable, TextInput } from "react-native";
import { delete_pack_by_uuid, get_hymns_by_uuid, get_pack_by_uuid, get_pack_hymns_paged, SIZE_PER_PAGE, update_or_add_pack } from "../../db/dexie";
import { Hymn, HymnsPack } from "../../db/models";
import Ionicons from "@expo/vector-icons/Ionicons";
import HymnosPageWrapper from "../../components/HymnosPageWrapper";
import EditableTextInput from "../../components/EditableTextInput";
import EditToolBox from "../../components/EditToolBox";
import { ToastContainer } from "react-toastify";
import Toolbox from "../../components/Toolbox";
import _ from "lodash";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import ConfirmModal from "../../components/ConfirmModal";
import { emitError, emitInfo, emitWarning } from "../../db/utils";
import SearchBar from "../../components/SearchBar";
import HymnosText from "../../components/HymnosText";

interface PagingMetaData {
  currentPage: number,
  maxPage: number
}

export default function HymnPack() {
  const { uuid } = useLocalSearchParams<{uuid: string }>();
  if (uuid == null){
    router.navigate("/notfound");
    return null;
  }
  
  // const [searchQuery, setSearchQuery] = useState("");
  const [hymnPack, setHymnPack] = useState<HymnsPack | null>(null);
  const [hymnPackBackup, setHymnPackBackup] = useState<HymnsPack | null>(null);
  const [hymnsInPage, setHymnsInPage] = useState<Hymn[]>([]);
  const [pagingMetaData, setPagingMetaData] = useState<PagingMetaData>({currentPage:1, maxPage:1});
  const [isAddingHymn, setIsAddingHymn] = useState(false);
  const [isEditingPack, setIsEditingPack] = useState<boolean>(false);
  const confirmModal = useConfirmModal();
  const handleInputChange = (key: string, value: string) => {
    setHymnPack(prev => ({ ...prev, [key]: value}))
  };

  const refreshHymnsInPage = (pack: HymnsPack, page: number) => {
      get_pack_hymns_paged(uuid, page).then((res) => {
        setHymnsInPage(res);
        setPagingMetaData({currentPage:page, maxPage: Math.ceil(pack.hymns_uuid.length / SIZE_PER_PAGE)})
      });
  }

  const onSearchTextChange = (query: string) => {

  }

  // Fetch hymn pack details from backend
  useEffect(() => {
    get_pack_by_uuid(uuid)
      .then((p) => {
        setHymnPack(p);
        setHymnPackBackup(_.cloneDeep(p));
        refreshHymnsInPage(p, pagingMetaData.currentPage);
      })
      .catch((e) => { console.log(e); router.navigate("/notfound"); });
  }, []);


  if (!hymnPack) {
    return (
      <View className="flex-1 items-center justify-center">
        <HymnosText>Loading...</HymnosText>
      </View>
    );
  }


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
                    deleteIconClassName="text-red-500 hover:text-red-600 duration-100"
                    submitIconClassName="text-green-400 hover:text-green-500 duration-100"
                    cancelIconClassName="text-red-400 hover:text-red-500 duration-100"
                    className="flex flex-row"
                    showOnlyIf={isEditingPack}
                    cancelEditCallback={()=>{setHymnPack(_.cloneDeep(hymnPackBackup)); setIsEditingPack(false);}}
                    deleteCallback={()=>{
                      delete_pack_by_uuid(uuid).then(()=>{
                        setIsEditingPack(false);
                        emitInfo("Pack was deleted! Returning to home page..", ()=>router.navigate("/"))
                      })
                    }}
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
                        setIsEditingPack(false);
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

          {/* Hymn Titles */}
          <View className="justify-center gap-y-4">
            
            <View className="flex flex-row items-center justify-between">
              <Pressable onPress={()=>{ setIsAddingHymn(!isAddingHymn); }}>
                <Ionicons name={isAddingHymn ? "close-circle" : "add-circle"} size={30} className="text-green-400 hover:text-green-500 duration-100"/>
              </Pressable>
              <HymnosText className="text-2xl font-medium">الترانيم في هذه المكتبه</HymnosText>
            </View>
            


            {isAddingHymn ? 
              <View className="h-[50vh]">
                <SearchBar onPressItemCallback={(item)=>{
                  setHymnPack(prev => {
                    if (prev.hymns_uuid.includes(item.hymn_uuid)){
                      emitWarning("Hymn already present in pack!");
                      return prev
                    }
                    const withAddedHymn = prev;
                    withAddedHymn.hymns_uuid.push(item.hymn_uuid)
                    update_or_add_pack(withAddedHymn).then(()=>{
                      emitInfo("Hymn added successfully to pack!");
                      refreshHymnsInPage(withAddedHymn, pagingMetaData.currentPage);
                    })
                    return withAddedHymn
                  })

                }}/>
              </View>
            : 
            <View className="h-[50vh]">
              <FlatList
                data={hymnsInPage}
                keyExtractor={(item) => item.uuid}
                contentContainerClassName="gap-y-2"
                renderItem={({ item }) => (
                  <View className="border-2 border-gray-200 flex flex-row w-full justify-center items-center p-2 gap-1 bg-gray-100 rounded-lg">
                    {isEditingPack && <Pressable onPress={()=>{ 
                        confirmModal.show(()=>{ 
                          // We need to reload page to re-fetch paging
                          // todo: find if there's a better way
                          const updatedPack = ({...hymnPack, hymns_uuid: hymnPack.hymns_uuid.filter(id => id != item.uuid) })
                          update_or_add_pack( updatedPack ).then(()=>{
                            setIsEditingPack(false);
                            setHymnPack(updatedPack);
                            refreshHymnsInPage(updatedPack, pagingMetaData.currentPage);
                          });
                        });
                      }}>
                      <Ionicons name="trash-outline" size={20} className={"text-red-500 hover:text-red-600 duration-100 animate-pulse"}/>
                    </Pressable>}
                    <Pressable className="p-4 rounded-lg flex-1" onPress={()=>{router.navigate(`/hymn/details?uuid=${item.uuid}`)}}>
                      <HymnosText>{item.title}</HymnosText>
                    </Pressable>
                  </View>
                )}/>
                <View className="flex flex-row justify-between items-center p-4">
                    <Pressable disabled={pagingMetaData.currentPage == 1} onPress={()=>{refreshHymnsInPage(hymnPack, pagingMetaData.currentPage - 1);}}>
                        <Ionicons name="chevron-back" 
                                  size={30} 
                                  className={`${pagingMetaData.currentPage == 1 ? "text-gray-400" : "text-gray-500 hover:scale-110 hover:text-gray-600 duration-100"}`}/>
                    </Pressable>
                    <HymnosText>Page: {pagingMetaData.currentPage} - { pagingMetaData.maxPage} </HymnosText>
                    <Pressable disabled={pagingMetaData.currentPage == pagingMetaData.maxPage } onPress={()=>{refreshHymnsInPage(hymnPack, pagingMetaData.currentPage + 1);}}>
                        <Ionicons name="chevron-forward" 
                                  size={30} 
                                  className={`${pagingMetaData.currentPage == pagingMetaData.maxPage ? "text-gray-400" : "text-gray-500 hover:scale-110 hover:text-gray-600 duration-100"}`}/>
                    </Pressable>
                  </View>
              </View>
            }
          </View>
    </HymnosPageWrapper>
  );
}
