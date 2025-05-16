import "../assets/global.css";
import React, { useState, useEffect, memo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { get_all_packs, get_hymns_by_uuid, insert_hymns_and_packs, is_db_empty} from "../db/dexie";
import * as API from "../generated/";
import { Hymn, HymnsPack } from "../db/models";
import { AxiosResponse } from "axios";
import * as fzstd from "fzstd";
import ProgressBar from "../components/ProgressBar";
import useHymnosState from "../global";
import { addLastViewedHymn, getLastViewedHymns } from "../db/localstorage";
import HymnosPageWrapper from "../components/HymnosPageWrapper";
import SearchBar from "../components/SearchBar";
import _ from "lodash";
import Ionicons from "@expo/vector-icons/Ionicons";
import HymnosText from "../components/HymnosText";

const HymnosAPI = new API.DefaultApi(new API.Configuration({"basePath":"http://localhost:8000"}))

export default memo(function HomePage() {
  const [hymnPacks, setHymnPacks] = useState<HymnsPack[]>([]);

  // we should think of a mechanism how to store the last viewed hymns in the database
  const [lastViewedHymns, setLastViewedHymns] = useState<Hymn[]>([]);

  // non-reactive for passing to fetchDb, re-renders <ProgressBar/> only
  const syncProgressCallback = useHymnosState.getState().setSyncProgressPercentage;

  const fetchInitialData = useCallback(()=>{
    (async () => {
      // we shouldn't fetch anything if the database contain hymns
      if (!await is_db_empty()) {
        const allPacks = await get_all_packs();
        setHymnPacks(allPacks);
        
        const lastViewedHymnsUuids = getLastViewedHymns()
        // removes undefined elements from previously deleted items
        const lastViewedHymns = _.compact(await get_hymns_by_uuid(lastViewedHymnsUuids)) 
        // console.log(lastViewedHymns)
        setLastViewedHymns(lastViewedHymns);
        return
      }
      HymnosAPI.downloadLatestJsonDataLatestDownloadGet({"responseType": "arraybuffer"}).then((res)=>{
        // Decompress response and add to database
        const buffer: ArrayBuffer = (res as AxiosResponse<any, ArrayBuffer>).data;
        const compressed = new Uint8Array(buffer);
        const decompressed = fzstd.decompress(compressed);
        // convert decompressed buffer to json 
        const json: API.HymnosItems = JSON.parse(new TextDecoder().decode(decompressed));
  
        const startTime = performance.now()
        // todo: taking too much time, should be chunked up..
        insert_hymns_and_packs(json.hymns, json.packs, json.slides, 200, syncProgressCallback).then(()=>{
          const endTime = performance.now()
          console.log(`Call to bulk import took ${endTime - startTime} milliseconds`)
          // Add pack to list if not present
          setHymnPacks(json.packs);
        }); 
        
      }, (r)=>{
        console.error(r)
      })
    })()
  },[]) 

  // Fetch hymn packs from backend
  useEffect(() => {
      fetchInitialData();
      return () => {console.log("cleanup called!")}
  },[fetchInitialData] );

  
  return (
    <HymnosPageWrapper>
        {/* Search Bar */}
        <View className="flex items-center justify-end mt-8 gap-y-4 z-20  min-h-[40%]">
          {/* Progress Bar */}
          <ProgressBar/> 
          <HymnosText className="text-4xl font-bold text-gray-800">ϩⲩⲙⲛⲟⲥ</HymnosText>
          <SearchBar onPressItemCallback={(item)=>{ 
                addLastViewedHymn(item.hymn_uuid);
                router.push(`/hymn/presentation?uuid=${item.hymn_uuid}`);
          }}/>
          
        </View>

        <ScrollView contentContainerClassName="gap-y-4">
          <View className="gap-y-4">
            <View className="flex flex-row justify-between items-center">
              <Pressable onPress={()=>{router.navigate("/create/pack")}}>
                <Ionicons name={"add"} size={30} className="text-green-400 hover:text-green-500 duration-100"/>
              </Pressable>
              <HymnosText className="text-2xl font-medium text-gray-800">مكاتب الترانيم</HymnosText>
            </View>
            
            
            <FlatList
              data={hymnPacks}
              inverted
              keyExtractor={(item) => item.uuid}
              horizontal
              renderItem={({ item }) => (
                <TouchableOpacity className="border-2 border-gray-200 p-4 bg-gray-100 rounded-lg w-48 mr-2" onPress={() => router.navigate(`/hymn/pack?uuid=${item.uuid}`)}>
                  <HymnosText className="font-medium text-gray-800">{item.title}</HymnosText>
                  <HymnosText className="text-gray-600 mt-2">{item.description}</HymnosText>
                </TouchableOpacity>
              )}
            />
          </View>

          <View className="gap-y-4">
            <View className="flex flex-row justify-between items-center">
              <Pressable onPress={()=>{router.navigate("/create/hymn")}}>
                <Ionicons name={"add"} size={30} className="text-green-400 hover:text-green-500 duration-100"/>
              </Pressable>
              <HymnosText className="text-2xl font-medium text-gray-800">الترانيم السابقه</HymnosText>
            </View>

            <FlatList
              data={lastViewedHymns}
              keyExtractor={(item) => item.uuid}
              horizontal
              renderItem={({ item }) => (
                <TouchableOpacity className="border-2 border-gray-200 p-4 bg-gray-100 rounded-lg w-48 mr-2" onPress={() => router.navigate(`/hymn/presentation?uuid=${item.uuid}`)}>
                  <HymnosText className="font-medium text-gray-800">{item.title}</HymnosText>
                  <HymnosText className="text-gray-600 mt-2">Author: {item.author}</HymnosText>
                  <HymnosText className="text-gray-600 mt-2">Composer: {item.composer}</HymnosText>
                </TouchableOpacity>
              )}
            />
          </View>
        </ScrollView>
    </HymnosPageWrapper>
  );
})
