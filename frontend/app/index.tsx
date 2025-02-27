import "../assets/global.css";
import React, { useState, useEffect, memo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { get_hymns_from_slides, insert_hymns_and_packs, is_db_empty, search_in_slides} from "../db/dexie";
import * as API from "../generated/";
import { Hymn, HymnsPack } from "../db/models";
import { AxiosResponse } from "axios";
import * as fzstd from "fzstd";
import SearchResultsList, { SearchResultsListProps } from "../components/SearchResultsList";
import ProgressBar from "../components/ProgressBar";
import useHymnosState from "../global";
const HymnosAPI = new API.DefaultApi(new API.Configuration({"basePath":"http://localhost:8000"}))


export default memo(function HomePage() {
  console.log("Rendering HomePage");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultsListProps[]>([])

  const [hymnPacks, setHymnPacks] = useState<HymnsPack[]>([]);

  // we should think of a mechanism how to store the last viewed hymns in the database
  const [lastViewedHymns, setLastViewedHymns] = useState<Hymn[]>([]);

  // non-reactive for passing to fetchDb, re-renders <ProgressBar/> only
  const syncProgressCallback = useHymnosState.getState().setSyncProgressPercentage;

  const fetchInitialData = useCallback(()=>{
    (async () => {
      // we shouldn't fetch anything if the database contain hymns
      if (!await is_db_empty()) {
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
        insert_hymns_and_packs(json.hymns, json.packs, json.slides, 5000, syncProgressCallback).then(()=>{
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

  const onSearchTextChange = async (searchWord: string) => {
        setSearchQuery(searchWord); 
        if (searchWord.trim().length == 0) {
          setSearchResults([]);
          return;
        }
        const slides = await search_in_slides(searchWord);
        const hymns = await get_hymns_from_slides(slides);
        const hymnMap = Object.fromEntries(hymns.map(({ uuid, title }) => [uuid, title]));
        const sr: SearchResultsListProps[] = slides.flatMap(({ hymn_uuid, lines }) => ({hymn_uuid: hymn_uuid, title: hymnMap[hymn_uuid], searchLine: lines.join(" | ") }));
        setSearchResults(sr);
    };
  
  
  return (
    <View className="flex justify-center items-center h-full w-full">
      <View className="flex p-4 gap-y-4 w-3/4 border-2">
        {/* <Button title="Dexei DB" onPress={() => {bulk_insert_hymns();}}></Button> */}
        {/* Search Bar */}
        <View className="flex items-center justify-center mt-8 gap-y-4 relative z-20">

          {/* Progress Bar */}
          <ProgressBar/> 

          <Text className="text-2xl font-bold">ϩⲩⲙⲛⲟⲥ | هيمنوس</Text>
          <TextInput
            className="w-full p-4 border rounded-lg border-gray-300 text-lg"
            placeholder="Search Hymns..."
            value={searchQuery}
            onChangeText={searchWord => onSearchTextChange(searchWord)}
          />
          {/* Drop Down Search Results */}
          {searchResults.length > 0 && <SearchResultsList items={searchResults}/>}
        </View>

        {/* Hymn Packs Section */}
        <View className="gap-y-4">
          <Text className="text-xl font-bold">Hymn Packs</Text>
          <FlatList
            data={hymnPacks}
            keyExtractor={(item) => item.uuid}
            horizontal
            renderItem={({ item }) => (
              <TouchableOpacity className="p-4 bg-gray-100 rounded-lg w-48 mr-2" onPress={() => router.navigate("/hymn/pack")}>
                <Text className="font-semibold">{item.title}</Text>
                <Text className="text-gray-600 mt-2">{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Last Viewed Hymns */}
        <View className="gap-y-4">
          <Text className="text-xl font-bold">Last Viewed Hymns</Text>
          <FlatList
            data={lastViewedHymns}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="p-4 bg-gray-100 rounded-lg mb-2">
                <Text className="font-semibold">{item.title}</Text>
              </View>
            )}
          />
        </View>
      </View>
    </View>
  );
})
