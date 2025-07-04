import { search_hymn, search_slide_columns } from "@db/utils/search";
import { PGlite } from "@electric-sql/pglite/dist/index.cjs";
import useHymnosState from "global";
import { sortBy, uniqBy } from "lodash";
import React, { memo, useCallback, useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import SearchResultsList, { SearchResultsItem } from "./SearchResultsList";

const runSearch = async (db: PGlite, searchWord: string) => {
  try {
    const raw_slide_results = await search_slide_columns(db, searchWord);
    const raw_hymn_results = await search_hymn(db, searchWord);

    const slides_results = raw_slide_results.map((r) => {
      const sri: SearchResultsItem = {
        _slide_uuid: r.slide_id,
        title: r.content,
        subTitle: `${r.hymn_name}`,
        _hymn_uuid: r.hymn_id,
        titleIconName: "align-right",
        subTitleIconName: "music",
        score: r.score,
      };
      return sri;
    });

    const hymn_results = raw_hymn_results.map((r) => {
      const sri: SearchResultsItem = {
        title: r.name,
        subTitle: `${r.author || "غير محدد"} | ${r.composer || "غير محدد"} `,
        _hymn_uuid: r.id,
        titleIconName: "music",
        subTitleIconName: "user",
        score: r.score,
      };
      return sri;
    });

    const all_results = [...hymn_results, ...slides_results];
    const unique_results = sortBy(
      uniqBy(all_results, (item) => `${item.title}|${item.subTitle}`),
      (item) => item.score,
    );
    return unique_results;

    // const allResults = [...hymnResults, ...slideResults];
    // return allResults;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
};

interface SearchBarProps {
  db: PGlite;
  onPressItemCallback: (item: SearchResultsItem) => void;
}
export interface SearchFns {
  hymns: (query: string) => Promise<any>;
  slides: (query: string) => Promise<any>;
}

export default memo(function SearchBar({
  db,
  onPressItemCallback,
}: SearchBarProps) {
  const [searchResults, setSearchResults] = useState<SearchResultsItem[]>([]);
  const [resultsLoading, setResultsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchDebounceDelay = useHymnosState(
    (state) => state.searchDebounceDelay,
  );

  // const debouncedSearch = useCallback(
  //   debounce(
  //     async (db: PGlite, query: string) => {
  //       const results = await runSearch(db, query);
  //       setSearchResults(results);
  //       setResultsLoading(false);
  //     },
  //     searchDebounceDelay,
  //     { trailing: true },
  //   ),
  //   [searchDebounceDelay],
  // );

  // Do the search on query change
  useEffect(() => {
    setResultsLoading(true);
    // debouncedSearch(db, searchQuery);
    (async () => {
      const results = await runSearch(db, searchQuery);
      setSearchResults(results);
      setResultsLoading(false);
    })();
  }, [searchQuery]);

  const onChangeText = useCallback((searchWord: string) => {
    setSearchQuery(searchWord);
    setShowSearchResults(true);
  }, []);

  const onFocus = useCallback(() => {
    setShowSearchResults(searchQuery.trim().length > 0);
  }, [searchQuery]);

  const onBlur = useCallback(() => {
    // we should use a ref to search results to check if the cursor is selecting
    setTimeout(() => {
      setShowSearchResults(false);
    }, 100);
  }, []);

  return (
    <View className="w-full">
      <TextInput
        style={{ fontFamily: "Rubik_400Regular", direction: "rtl" }}
        className="md:w-1/2 md:focus:w-full w-full self-center p-4 border-2 rounded-lg border-gray-400 text-lg text-gray-800 outline-none shadow focus:border-gray-800 duration-500"
        placeholder="ابحث عن ترانيم.."
        placeholderTextColor="#6b7280"
        value={searchQuery}
        onFocus={onFocus}
        onBlur={onBlur}
        onChangeText={onChangeText}
      />
      {showSearchResults && (
        <SearchResultsList
          onPressItemCallback={onPressItemCallback}
          searchResults={searchResults}
          resultsLoading={resultsLoading}
        />
      )}
    </View>
  );
});
