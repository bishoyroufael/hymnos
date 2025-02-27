
import React from "react"
import { FlatList, View, Text, Pressable } from "react-native"
import { get_slides_of_hymn } from "../db/dexie"
import { router } from "expo-router"

export interface SearchResultsListProps {
    hymn_uuid: string
    title: string
    searchLine: string
}

export default function SearchResultsList ({items}: {items: SearchResultsListProps[]}) {
  return (
   <View className="w-full p-2 rounded-lg bg-gray-200 absolute top-full mt-1 h-fit max-h-full shadow">
    <FlatList
            data={items}
            className="h-full"
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
            <Pressable className="p-2 border-b border-gray-300 transition duration-200 ease-in-out hover:scale-x-[.98]" 
                        onPress={()=>{router.push(`/hymn/presentation?uuid=${item.hymn_uuid}`);}}
            >
                <Text className="text-lg font-semibold text-gray-800">{item.title}</Text>
                <Text className="text-sm text-gray-600">{item.searchLine}</Text>
            </Pressable>
            )}
        />
   </View>
  )
};

