import Card from "@components/base/Card";
import HymnosText from "@components/base/HymnosText";
import Logo from "@components/base/Logo";
import SearchBar from "@components/base/SearchBar";
import { SearchResultsItem } from "@components/base/SearchResultsList";
import { get_all_bibles, get_all_packs } from "@db/crud/read";
import { ContentType, components as OPENAPI } from "@db/models";
import Feather from "@expo/vector-icons/Feather";
import { HorizontalHymnList, renderSkeletons } from "@fractions/home-screen";
import { get_last_viewed_content_details } from "@fractions/home-screen/handlers";
import { LastViewedCardDetails } from "@fractions/home-screen/types";
import { usePGliteContext } from "context/PGliteContext";
import { router } from "expo-router";
import useHymnosState from "global";
import React, { memo, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import "../assets/global.css";

type Pack = OPENAPI["schemas"]["Pack"];
type BibleView = OPENAPI["schemas"]["BibleView"];
type HymnView = OPENAPI["schemas"]["HymnView"];

export default memo(function HomePage() {
  // used for skeleton
  const [homeData, setHomeData] = useState<{
    packs: Pack[];
    bibles: BibleView[];
  }>({ packs: [], bibles: [] });
  const [lastViewedContent, setLastViewedContent] = useState<
    LastViewedCardDetails[]
  >([]);
  const lastViewedContentsUuids = useHymnosState.getState().lastViewedContent;
  const [loadingData, setLoadingData] = useState(false);
  const { db } = usePGliteContext();
  const importUserDataStatus = useHymnosState(
    (state) => state.importUserDataStatus,
  );

  // Fetch hymn packs from backend
  useEffect(() => {
    setLoadingData(true);
    (async () => {
      const packs = await get_all_packs(db);
      const bibles = await get_all_bibles(db);
      const lvContents = [];
      for (const contentUuid of lastViewedContentsUuids) {
        const content = await get_last_viewed_content_details(db, contentUuid);
        // Get only valid ones
        if (content) {
          lvContents.push(content);
        }
      }
      setHomeData({ packs, bibles });
      setLastViewedContent(lvContents);
      setLoadingData(false);
    })();
  }, []);

  // refresh packs in-case importing is happening
  useEffect(() => {
    if (importUserDataStatus === "inprogress") {
      setLoadingData(true);
    } else if (importUserDataStatus === "done") {
      (async () => {
        await refreshHomeData();
        setLoadingData(false);
      })();
    }
  }, [importUserDataStatus]);

  const refreshHomeData = async () => {
    const packs = await get_all_packs(db);
    const bibles = await get_all_bibles(db);
    setHomeData({ packs, bibles });
  };

  return (
    <>
      {/* Hero Section */}
      <View className="flex items-center justify-end mt-8 gap-y-4 z-20">
        <View className="flex flex-column items-center gap-6">
          <Logo />
          <HymnosText className="text-md text-gray-600">
            مكتبة شاملة لعرض الترانيم والليتورجيا الكنسية.{" "}
          </HymnosText>
        </View>
        <SearchBar
          db={db}
          onPressItemCallback={(item: SearchResultsItem) => {
            if (item._slide_uuid) {
              // toggleFullScreen();
              router.push(
                `/presentation/${item._resource_uuid}?startSlide=${item._slide_uuid}`,
              );
            } else {
              if (item._resource_type == ContentType.hymn) {
                router.push(`/hymn/${item._resource_uuid}`);
              } else if (item._resource_type == ContentType.bible_book) {
                router.push(`/book/${item._resource_uuid}`);
              } else {
              }
            }
          }}
        />
      </View>
      {/* Library Section */}
      <ScrollView contentContainerClassName="gap-y-4 min-h-80">
        <View className="flex flex-col gap-x-4 w-full md:flex-row-reverse">
          <View className="gap-y-4 flex-1">
            <View className="flex flex-row justify-between items-center gap-4">
              <View className="h-0.5 bg-gray-200 flex-1 items-center justify-center"></View>
              <HymnosText className="text-2xl font-medium text-gray-800">
                الكتاب المقدس
              </HymnosText>
              <Feather name="book" size={20} className="text-gray-800" />
            </View>
            <HorizontalHymnList
              data={homeData.bibles}
              isLoading={loadingData}
              skeletonElement={renderSkeletons()}
              emptyResultsElement={
                <Card
                  className="group"
                  onPressCallback={() => router.navigate("/pack/create")}
                  customView={
                    <Feather
                      name="plus"
                      size={30}
                      className="text-gray-400 text-center group-hover:scale-125 duration-200 transition ease-in-out"
                    />
                  }
                />
              }
              onCardPress={(item) => {
                router.navigate(`/bible/${item.id}`);
              }}
              renderCardDescription={(item) => item.translation.name}
              renderCardName={(item) =>
                `الكتاب المقدس (${item.translation.abbr})`
              }
            />
          </View>

          <View className="gap-y-4 flex-1">
            <View className="flex flex-row justify-between items-center gap-4">
              <View className="h-0.5 bg-gray-200 flex-1 items-center justify-center"></View>
              <HymnosText className="text-2xl font-medium text-gray-800">
                مكاتب الترانيم
              </HymnosText>
              <Feather name="folder" size={20} className="text-gray-800" />
            </View>
            <HorizontalHymnList
              data={homeData.packs}
              isLoading={loadingData}
              skeletonElement={renderSkeletons()}
              emptyResultsElement={
                <Card
                  className="group"
                  onPressCallback={() => router.navigate("/pack/create")}
                  customView={
                    <Feather
                      name="plus"
                      size={30}
                      className="text-gray-400 text-center group-hover:scale-125 duration-200 transition ease-in-out"
                    />
                  }
                />
              }
              onCardPress={(item) => {
                router.navigate(`/pack/${item.id}`);
              }}
              renderCardDescription={(item) => item.description}
              renderCardName={(item) => item.name}
            />
          </View>
        </View>

        <View className="gap-y-4">
          <View className="flex flex-row justify-between items-center gap-4">
            <View className="h-0.5 bg-gray-200 flex-1 items-center justify-center"></View>
            <HymnosText className="text-2xl font-medium text-gray-800">
              شاهدته مؤخراً
            </HymnosText>
            <Feather name="eye" size={20} className="text-gray-800" />
          </View>
          <HorizontalHymnList
            data={lastViewedContent}
            isLoading={loadingData}
            skeletonElement={renderSkeletons()}
            emptyResultsElement={<></>}
            onCardPress={(item) => {
              // toggleFullScreen();
              router.navigate(`/presentation/${item.id}`);
            }}
            renderCardDescription={(item) => item.description}
            renderCardName={(item) => item.name}
          />
        </View>
      </ScrollView>
    </>
  );
});
