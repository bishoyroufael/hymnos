import HymnosPageWrapper from "@components/base/HymnosPageWrapper";
import HymnosText from "@components/base/HymnosText";
import ProgressBar from "@components/base/ProgressBar";
import SearchBar from "@components/base/SearchBar";
import { Hymn, HymnsPack } from "@db/models";
import Feather from "@expo/vector-icons/Feather";
import { HorizontalHymnList, renderSkeletons } from "@fractions/home-screen";
import { updatePacks } from "@fractions/home-screen/handlers";
import { toggleFullScreen } from "@utils/ui";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { memo, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import "../assets/global.css";
import { useFetchInitialData } from "@fractions/home-screen/hooks";

export default memo(function HomePage() {
  // used for skeleton
  const [hymnPacks, setHymnPacks] = useState<HymnsPack[]>([]);
  // we should think of a mechanism how to store the last viewed hymns in the database
  const [lastViewedHymns, setLastViewedHymns] = useState<Hymn[]>([]);
  const [isFetchingFromRemote, setIsFetchingFromRemote] =
    useState<boolean>(false);

  const fetchInitialData = useFetchInitialData(
    setHymnPacks,
    setLastViewedHymns,
    setIsFetchingFromRemote,
  );

  // Fetch hymn packs from backend
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <HymnosPageWrapper onUploadDataCallback={() => updatePacks(setHymnPacks)}>
      {/* Hero Section */}
      <View className="flex items-center justify-end mt-8 gap-y-4 z-20">
        <View className="flex flex-column items-center gap-6">
          {/* <HymnosText className="text-7xl md:text-9xl font-light text-gray-400 hover:text-sky-400 duration-500 drop-shadow-[0_5.0px_1.0px_rgba(0,0,0.9,0.8)]">
            ϩⲩⲙⲛⲟⲥ
          </HymnosText> */}
          <Image
            source={require("../public/logo512.png")}
            className="w-48 h-48 drop-shadow-[0_5.0px_4.0px_rgba(0,0,0.8,0.8)] hover:drop-shadow-[0_8.0px_8.0px_rgba(0,0,0.8,0.8)] hover:-translate-y-2 duration-500"
          />
          <HymnosText className="text-md text-gray-600">
            مكتبة شاملة لعرض الترانيم والليتورجيا الكنسية.{" "}
          </HymnosText>
        </View>
        {/* Progress Bar */}
        <ProgressBar />
        <SearchBar
          onPressItemCallback={(item) => {
            toggleFullScreen();
            router.push(
              `/hymn/presentation?uuid=${item.hymn_uuid}&startSlide=${item.slide_uuid}`,
            );
          }}
        />
      </View>
      {/* Library Section */}
      <ScrollView contentContainerClassName="gap-y-4">
        <View className="gap-y-4">
          <View className="flex flex-row justify-between items-center gap-4">
            <View className="h-0.5 bg-gray-200 flex-1 items-center justify-center"></View>
            <HymnosText className="text-2xl font-medium text-gray-800">
              مكاتب الترانيم
            </HymnosText>
            <Feather name="folder" size={20} className="text-gray-800" />
          </View>
          <HorizontalHymnList
            data={hymnPacks}
            isLoading={isFetchingFromRemote}
            skeletonElement={renderSkeletons()}
            emptyResultsElement={<></>}
            onCardPress={(item) => {
              router.navigate(`/hymn/pack?uuid=${item.uuid}`);
            }}
            renderCardDescription={(item) => item.description}
          />
        </View>
        <View className="gap-y-4">
          <View className="flex flex-row justify-between items-center gap-4">
            <View className="h-0.5 bg-gray-200 flex-1 items-center justify-center"></View>
            <HymnosText className="text-2xl font-medium text-gray-800">
              الترانيم السابقه
            </HymnosText>
            <Feather name="music" size={20} className="text-gray-800" />
          </View>
          <HorizontalHymnList
            data={lastViewedHymns}
            isLoading={isFetchingFromRemote}
            skeletonElement={renderSkeletons()}
            emptyResultsElement={<></>}
            onCardPress={(item) => {
              toggleFullScreen();
              router.navigate(`/hymn/presentation?uuid=${item.uuid}`);
            }}
            renderCardDescription={(item) =>
              `المؤلف: ${item.author || "مجهول"}\nالملحن: ${item.composer || "مجهول"}`
            }
          />
        </View>
      </ScrollView>
    </HymnosPageWrapper>
  );
});
