import React, { useState, useEffect, useMemo } from "react";
import "../global.css";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Platform,
  Button,
} from "react-native";
import { Link } from "expo-router";
import { db, insert_hymns_and_packs, search_text } from "../db/dexie";
import * as API from "../generated/";
import { Hymn, HymnsPack } from "../db/models";
import { AxiosResponse } from "axios";
import * as fzstd from "fzstd";

const HymnosAPI = new API.DefaultApi(new API.Configuration({"basePath":"http://localhost:8000"}))


export default function HomePage() {
  /*const [loaded, error] = useFonts({
    Amiri_400Regular,
    Rubik_400Regular,
    BalooBhaijaan2_400Regular,
  });*/
  const [searchQuery, setSearchQuery] = useState("");
  const [hymnPacks, setHymnPacks] = useState<HymnsPack[]>([]);
  const [lastViewedHymns, setLastViewedHymns] = useState<Hymn[]>([]);

  const fetchHymnPacks = async () => {
    HymnosAPI.downloadLatestJsonDataLatestDownloadGet({"responseType": "arraybuffer"}).then((res)=>{
      // Decompress response and add to database
      const buffer: ArrayBuffer = (res as AxiosResponse<any, ArrayBuffer>).data;
      const compressed = new Uint8Array(buffer);
      const decompressed = fzstd.decompress(compressed);
      // convert decompressed buffer to json 
      const json: API.HymnosItems = JSON.parse(new TextDecoder().decode(decompressed));
      // console.log(json)
      // insert_hymns_and_packs(json.hymns, json.packs, json.slides); 
      
      // Add pack to list if not present
      setHymnPacks(json.packs);
    }, (r)=>{
      console.error(r)
    })
  };

  // Fetch hymn packs from backend
  useEffect(() => {
      (async () => {await fetchHymnPacks()})()
    },[] 
  );

  return (
    <View className="flex justify-center items-center h-full w-full">
      <View className="flex p-4 gap-y-4 w-3/4 border-2">
        {/* <Button title="Dexei DB" onPress={() => {bulk_insert_hymns();}}></Button> */}
        {/* Search Bar */}
        <View className="flex items-center justify-center mt-8 gap-y-4">
          <Link href="/hymn/presentation" className="underline text-blue-500">
            Go to Hymn Presentation Page
          </Link>
          <Link href="/hymn/pack" className="underline text-blue-500">
            Go to Hymn Pack Page
          </Link>
          <Text className="text-2xl font-bold">Hymnos</Text>
          <TextInput
            className="w-full p-4 border rounded-lg border-gray-300 text-lg"
            placeholder="Search Hymns..."
            value={searchQuery}
            // onChangeText={setSearchQuery}
            onChangeText={(t)=>{setSearchQuery(t); search_text(t);}}
          />
        </View>

        {/* Hymn Packs Section */}
        <View className="gap-y-4">
          <Text className="text-xl font-bold">Hymn Packs</Text>
          <FlatList
            data={hymnPacks}
            keyExtractor={(item) => item.uuid}
            horizontal
            renderItem={({ item }) => (
              <TouchableOpacity className="p-4 bg-gray-100 rounded-lg w-48 mr-2">
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
}
