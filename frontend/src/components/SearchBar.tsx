import { usePGlite } from "@electric-sql/pglite-react";
import { useState, useEffect, useRef } from "react";
import { runSearch } from "../db/utils/search";
import type { SearchResultsItem } from "../db/utils/search";
import { SEARCH_FILTER_OPTIONS } from "../db/utils/search-types";
import { FiFilter, FiMusic, FiBookOpen, FiAlignRight, FiUser, FiBook, FiLoader } from "react-icons/fi";
import useHymnosStore from "../store";
import SearchInput from "./base/SearchInput";

// Hoisted — static, no need to recreate on every render
const FILTER_GROUPS = [
  { group: "hymn" as const, title: "تراتيل" },
  { group: "bible" as const, title: "الكتاب المقدس" },
  { group: "book" as const, title: "الكتب" },
];

interface SearchBarProps {
  onSelectResult?: (item: SearchResultsItem) => void;
  className?: string;
}

export default function SearchBar({ onSelectResult, className = "" }: SearchBarProps) {
  const db = usePGlite();
  const [searchResults, setSearchResults] = useState<SearchResultsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchInputKey, setSearchInputKey] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const filtersContainerRef = useRef<HTMLDetailsElement>(null);
  // Ref keeps the latest query accessible in effects without stale closures
  const searchQueryRef = useRef("");

  const filters = useHymnosStore((state) => state.searchFilters);
  const toggleSearchFilter = useHymnosStore((state) => state.toggleSearchFilter);

  // Called by SearchInput after the debounce — runs the actual search
  const handleSearch = async (query: string) => {
    if (!query || !db) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      setSearchResults(await runSearch(db, query, filters));
    } catch {
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run search immediately whenever filters change (no debounce needed for filter clicks)
  useEffect(() => {
    const query = searchQueryRef.current.trim();
    if (!query || !db) return;
    setIsLoading(true);
    runSearch(db, query, filters)
      .then(setSearchResults)
      .catch(() => setSearchResults([]))
      .finally(() => setIsLoading(false));
  }, [filters, db]);

  // Close dropdowns when clicking outside; manage mutual exclusivity
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInFilters = filtersContainerRef.current?.contains(target);
      const clickedInContainer = searchContainerRef.current?.contains(target);
      const targetElement = target as HTMLElement;
      // The query field is <input type="search"> (see SearchInput).
      const clickedOnSearchInput = targetElement.tagName === "INPUT" && (targetElement as HTMLInputElement).type === "search" && clickedInContainer;

      if (filtersContainerRef.current && (!clickedInFilters || clickedOnSearchInput)) {
        filtersContainerRef.current.removeAttribute("open");
      }
      if (!clickedInContainer) {
        setShowResults(false);
      }
      if (clickedOnSearchInput && searchQueryRef.current.trim().length > 0) {
        setShowResults(true);
      }
      if (clickedInFilters && !filtersContainerRef.current?.open) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const handleInputChange = (val: string) => {
    searchQueryRef.current = val;
    setShowResults(val.trim().length > 0);
  };

  const handleSelectResult = (item: SearchResultsItem) => {
    onSelectResult?.(item);
    setShowResults(false);
    searchQueryRef.current = "";
    setSearchInputKey((k) => k + 1);
  };

  return (
    <div ref={searchContainerRef} className={`relative w-full ${className}`}>
      <div className="flex w-full join">
        <SearchInput
          key={searchInputKey}
          className="flex-1 join-item"
          placeholder="ابحث عن ترنيمة، آية من الكتاب مقدس، أو نص..."
          onSearch={handleSearch}
          onInputChange={handleInputChange}
        />

        {/* Filter Toggle Button */}
        <details className="dropdown dropdown-end join-item" ref={filtersContainerRef}>
          <summary className="btn btn-sm lg:btn-lg btn-accent">
            <FiFilter className="h-3 w-3 lg:h-4 lg:w-5" />
          </summary>
          <div className="flex flex-col gap-2 dropdown-content mt-2 p-4 border border-base-200 rounded-box shadow-lg z-50 w-50 lg:w-64 max-w-68 bg-base-100 max-h-[40vh] overflow-y-auto">
            <div className="text-sm font-bold">تصفية النتائج</div>
            {FILTER_GROUPS.map(({ group, title }) => (
              <div key={group} className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-base-content/70">{title}</div>
                {SEARCH_FILTER_OPTIONS.filter((opt) => opt.group === group).map((option) => (
                  <label key={option.key} className="label justify-start gap-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={filters[option.key]}
                      onChange={() => toggleSearchFilter(option.key)}
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-wrap">{option.label}</span>
                      <span className="text-wrap text-xs text-base-content/50">{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Search Results Dropdown */}
      {showResults ? (
        <div className="absolute w-full mt-2 bg-base-100 border border-base-300 rounded-box shadow-lg z-40 max-h-[40vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <FiLoader className="inline-block h-6 w-6 animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-sm text-center text-base-content/60" dir="rtl">
              لا يوجد نتائج
            </div>
          ) : (
            <ul className="menu p-2 w-full">
              {searchResults.map((result, index) => {
                const TitleIcon = result.titleIconName === "music" ? FiMusic : result.titleIconName === "book-open" ? FiBookOpen : FiAlignRight;
                const SubtitleIcon = result.subTitleIconName === "user" ? FiUser : result.subTitleIconName === "book-open" ? FiBookOpen : FiBook;

                return (
                  <li key={`${result._resource_uuid}-${index}`}>
                    <button onClick={() => handleSelectResult(result)} className="hover:bg-base-200 rounded-lg">
                      <div className="flex flex-col w-full gap-1">
                        <div className="flex items-center gap-2 w-full">
                          <TitleIcon className="w-4 h-4 text-base-content/60" />
                          <span className="font-semibold text-base-content">{result.title}</span>
                        </div>
                        <div className="flex items-center gap-2 w-full text-sm text-base-content/60">
                          <SubtitleIcon className="w-3 h-3" />
                          <span>{result.subTitle}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
