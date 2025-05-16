import React from "react"
import { FlatList, View, Text, Pressable } from "react-native"
import { router } from "expo-router"
import { addLastViewedHymn } from "../db/localstorage"
import Ionicons from "@expo/vector-icons/Ionicons"
import HymnosText from "./HymnosText"

export interface SearchResultsItem {
    hymn_uuid: string
    title: string
    searchLine: string
}

interface SearchResultsListProps {
    items: SearchResultsItem[]
    onPressItemCallback: (item: SearchResultsItem) => void
}

export default function SearchResultsList ({items, onPressItemCallback}:SearchResultsListProps) {
  return (
   <View className="w-full p-2 rounded-lg bg-gray-200 absolute top-full mt-1 max-h-[30vh] min-h-fit shadow">
    <FlatList
            data={items}
            className="h-full"
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
            <Pressable className="p-2 border-b border-gray-300 transition duration-100 ease-in-out hover:border-gray-400" 
                        onPress={()=>{
                            // hymn is added to localstorage
                            onPressItemCallback(item);
                        }}
            >
                <View className="gap-1">
                    <HymnosText className="text-lg text-gray-600">{item.searchLine}</HymnosText>

                    <View className="flex flex-row justify-end items-center gap-1">
                        <HymnosText className="text-sm font-semibold text-gray-800">{item.title}</HymnosText>
                        <Ionicons name="musical-note" size={15} className="text-gray-800"/>
                    </View>
                </View>
            </Pressable>
            )}
        />
   </View>
  )
};

