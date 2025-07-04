import HymnosText from "@components/base/HymnosText";
import Feather from "@expo/vector-icons/Feather";
import React, { memo, useCallback } from "react";
import { FlatList, Pressable, View, ViewProps } from "react-native";

export interface SearchResultsItem {
  title: string;
  subTitle: string;
  subTitleIconName: string;
  titleIconName: string;
  _hymn_uuid: string;
  _slide_uuid?: string;
  score: number;
}

interface SearchResultsListProps extends ViewProps {
  searchResults: SearchResultsItem[];
  resultsLoading: boolean;
  onPressItemCallback: (item: SearchResultsItem) => void;
}

// Memoize individual search result item
const SearchResultItem = memo(
  ({ item, onPress }: { item: SearchResultsItem; onPress: () => void }) => (
    <Pressable
      className="p-2 border-b border-gray-300 transition duration-100 ease-in-out hover:border-gray-400"
      onPress={onPress}
    >
      <View className="gap-1">
        <View className="flex flex-row justify-end items-center gap-1">
          <HymnosText className="text-lg text-gray-600">
            {item.title}
          </HymnosText>
          <Feather
            name={item.titleIconName as any}
            size={20}
            className="text-gray-800"
          />
        </View>
        <View className="flex flex-row justify-end items-center gap-1">
          <HymnosText className="text-sm font-semibold text-gray-800">
            {item.subTitle}
          </HymnosText>
          <Feather
            name={item.subTitleIconName as any}
            size={15}
            className="text-gray-800"
          />
        </View>
      </View>
    </Pressable>
  ),
);

export default memo(function SearchResultsList({
  searchResults,
  resultsLoading,
  onPressItemCallback,
}: SearchResultsListProps) {
  // Memoize the render function to prevent recreation
  const renderItem = useCallback(
    ({ item }: { item: SearchResultsItem }) => (
      <SearchResultItem item={item} onPress={() => onPressItemCallback(item)} />
    ),
    [onPressItemCallback],
  );

  // Memoize key extractor
  const keyExtractor = useCallback(
    (item: SearchResultsItem, index: number) =>
      item._slide_uuid || item._hymn_uuid || index.toString(),
    [],
  );

  return (
    <View className="w-full p-2 rounded-lg bg-gray-200 absolute top-full mt-1 shadow border-2 border-gray-300 hover:border-gray-400 duration-100">
      <FlatList
        ListEmptyComponent={
          <HymnosText className="p-2">لا يوجد نتائج...</HymnosText>
        }
        data={searchResults}
        className={`h-fit max-h-72 ${resultsLoading ? "opacity-50 pointer-events-none" : "opacity-100"} transition-opacity duration-100 ease-in-out`}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </View>
  );
});
