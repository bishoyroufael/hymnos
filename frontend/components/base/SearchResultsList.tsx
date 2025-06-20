import React from "react";
import { FlatList, View, Text, Pressable } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import HymnosText from "@components/base/HymnosText";
import Loader from "@components/base/Loader";

export interface SearchResultsItem {
  hymn_uuid: string;
  title: string;
  searchLine: string;
  slide_uuid: string;
}

interface SearchResultsListProps {
  items: SearchResultsItem[];
  onPressItemCallback: (item: SearchResultsItem) => void;
  isLoading: boolean;
}

export default function SearchResultsList({
  items,
  onPressItemCallback,
  isLoading,
}: SearchResultsListProps) {
  const renderItem = ({ item }) => (
    <Pressable
      className="p-2 border-b border-gray-300 transition duration-100 ease-in-out hover:border-gray-400"
      onPress={() => {
        // hymn is added to localstorage
        onPressItemCallback(item);
      }}
    >
      <View className="gap-1">
        <HymnosText className="text-lg text-gray-600">
          {item.searchLine}
        </HymnosText>

        <View className="flex flex-row justify-end items-center gap-1">
          <HymnosText className="text-sm font-semibold text-gray-800">
            {item.title}
          </HymnosText>
          <Feather name="music" size={15} className="text-gray-800" />
        </View>
      </View>
    </Pressable>
  );

  return (
    <View className="w-full p-2 rounded-lg bg-gray-200 absolute top-full mt-1 shadow border-2 border-gray-300 hover:border-gray-400 duration-100">
      {isLoading ? (
        <Loader />
      ) : items.length == 0 ? (
        <HymnosText className="p-2">لا يوجد نتائج...</HymnosText>
      ) : (
        <FlatList
          data={items}
          className="h-fit max-h-72"
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}
