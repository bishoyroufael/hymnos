import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import SearchResultsList, { SearchResultsItem } from "./SearchResultsList";
import { get_hymns_from_slides, search_in_slides } from "@db/dexie";
import { debounce, throttle } from "lodash";

interface SearchBarProps {
  onPressItemCallback: (item: SearchResultsItem) => void;
}

export default function SearchBar({ onPressItemCallback }: SearchBarProps) {
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const searchInDb = async (searchWord: string) => {
    const slides = await search_in_slides(searchWord);
    const hymns = await get_hymns_from_slides(slides);
    const hymnMap = Object.fromEntries(
      hymns.map(({ uuid, title }) => [uuid, title]),
    );
    const sr: SearchResultsItem[] = slides.flatMap(({ hymn_uuid, lines }) => ({
      hymn_uuid: hymn_uuid,
      title: hymnMap[hymn_uuid],
      searchLine: lines.join(" | "),
    }));
    setSearchResults(sr);
  };

  const throttledSearch = useCallback(throttle(searchInDb, 500), []);

  return (
    <View className="w-full">
      <TextInput
        style={{ fontFamily: "Rubik_400Regular" }}
        className="w-full p-4 border rounded-lg border-gray-200 text-lg text-gray-800 outline-none shadow"
        placeholder="Search Hymns..."
        placeholderTextColor="#6b7280" // text-gray-500
        value={searchQuery}
        onChangeText={(searchWord) => {
          setSearchQuery(searchWord);
          if (searchWord.trim().length < 3) {
            setSearchResults([]);
            return;
          }
          throttledSearch(searchWord);
        }}
      />
      {/* Drop Down Search Results */}
      {searchResults.length > 0 && (
        <SearchResultsList
          onPressItemCallback={onPressItemCallback}
          items={searchResults}
        />
      )}
    </View>
  );
}
