import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, FlatList, ScrollView, Pressable } from "react-native";
import { get_pack_by_uuid, get_pack_hymns_paged } from "../../db/dexie";
import { Hymn, HymnsPack } from "../../db/models";

// interface Hymn {
//   id: string;
//   title: string;
// }

// interface HymnPackDetails {
//   id: string;
//   name: string;
//   description: string;
//   creator: string;
//   dateCreated: string;
//   hymns: Hymn[];
// }

export default function HymnPack() {
  const { uuid } = useLocalSearchParams<{uuid: string }>();
  if (uuid == null){
    router.navigate("/notfound");
    return null;
  }
  
  const [hymnPack, setHymnPack] = useState<HymnsPack | null>(null);
  const [hymnsInPage, setHymnsInPage] = useState<Hymn[]>([]);

  // Fetch hymn pack details from backend
  useEffect(() => {
    get_pack_by_uuid(uuid)
      .then((p) => {
        setHymnPack(p);
        get_pack_hymns_paged(uuid).then((res) => {
          setHymnsInPage(res);
        });
      })
      .catch((e) => { console.log(e); router.navigate("/notfound"); });
  }, []);


  if (!hymnPack) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex justify-center items-center h-full w-full">
      <View className="flex p-4 gap-y-4 w-3/4 border-2">
        <ScrollView className="flex p-4">
          {/* Hymn Pack Information */}
          <View className="mb-8">
            <Text className="text-2xl font-bold">{hymnPack.title}</Text>
            <Text className="text-gray-700 mt-2">
              {hymnPack.description}
            </Text>
            <Text className="text-gray-500 mt-4">
              Created by: {hymnPack.author}
            </Text>
            <Text className="text-gray-500">
              Version: {hymnPack.version}
            </Text>
          </View>

          {/* Hymn Titles */}
          <View>
            <Text className="text-xl font-bold mb-4">Hymns in this Pack</Text>
            <FlatList
              className="max-h-72"
              data={hymnsInPage}
              keyExtractor={(item) => item.uuid}
              renderItem={({ item }) => (
                <View className="mb-2 p-4 bg-gray-100 rounded-lg">
                  <Text className="font-semibold">{item.title}</Text>
                </View>
              )}
            />
          </View>

        </ScrollView>
      </View>
    </View>
  );
}
