import {
  get_hymns_from_slides,
  search_in_slides_fuzzy,
  search_in_slides_prefix,
} from "@db/dexie";
import { Slide } from "@db/models";
import useHymnosState from "global";
import { debounce } from "lodash";
import React, { useCallback, useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import SearchResultsList, { SearchResultsItem } from "./SearchResultsList";

interface SearchBarProps {
  onPressItemCallback: (item: SearchResultsItem) => void;
}

export default function SearchBar({ onPressItemCallback }: SearchBarProps) {
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchIsLoading, setSearchIsLoading] = useState(false);
  const { searchDebounceDelay, enableFuzzySearch } = useHymnosState();

  const searchInDb = useCallback(
    async (searchWord: string) => {
      const search_fn = enableFuzzySearch
        ? search_in_slides_fuzzy
        : search_in_slides_prefix;
      const slides = (await search_fn(searchWord)) as Slide[];
      const hymns = await get_hymns_from_slides(slides);
      const hymnMap = Object.fromEntries(
        hymns.map(({ uuid, title }) => [uuid, title]),
      );
      const sr: SearchResultsItem[] = slides.flatMap(
        ({ hymn_uuid, lines, uuid }) => ({
          hymn_uuid: hymn_uuid,
          title: hymnMap[hymn_uuid],
          searchLine: lines.join(" | "),
          slide_uuid: uuid,
        }),
      );
      setSearchIsLoading(false);
      setSearchResults(sr);
    },
    [enableFuzzySearch],
  );

  const debouncedSearch = useMemo(() => {
    return debounce(searchInDb, searchDebounceDelay);
  }, [searchDebounceDelay, searchInDb]);

  const onChangeText = (searchWord: string) => {
    setSearchQuery(searchWord);
    if (searchWord.trim().length == 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setShowSearchResults(true);
    setSearchIsLoading(true);
    debouncedSearch(searchWord);
  };
  const onFocus = () => {
    setShowSearchResults(searchQuery.trim().length == 0 ? false : true);
  };
  return (
    <View className="w-full">
      <TextInput
        style={{ fontFamily: "Rubik_400Regular", direction: "rtl" }}
        className="md:w-1/2 md:focus:w-full w-full self-center p-4 border-2 rounded-lg border-gray-400 text-lg text-gray-800 outline-none shadow focus:border-gray-800 duration-500"
        placeholder="ابحث عن ترانيم.."
        placeholderTextColor="#6b7280" // text-gray-500
        value={searchQuery}
        onFocus={onFocus}
        onChangeText={onChangeText}
      />
      {/* Drop Down Search Results */}
      {showSearchResults && (
        <SearchResultsList
          isLoading={searchIsLoading}
          onPressItemCallback={onPressItemCallback}
          items={searchResults}
        />
      )}
    </View>
  );
}
