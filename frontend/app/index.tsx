import HymnosText from "@components/base/HymnosText";
import SearchBar from "@components/base/SearchBar";
import { SearchResultsItem } from "@components/base/SearchResultsList";
import { components as OPENAPI } from "@db/models";
import Feather from "@expo/vector-icons/Feather";
import { HorizontalHymnList, renderSkeletons } from "@fractions/home-screen";
import { getAllPacks, getHymnsUsingId } from "@fractions/home-screen/handlers";
import { toggleFullScreen } from "@utils/ui";
import { usePGliteContext } from "context/PGliteContext";
import { router } from "expo-router";
import useHymnosState from "global";
import React, { memo, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import "../assets/global.css";
import Card from "@components/base/Card";
import Logo from "@components/base/Logo";

type Pack = OPENAPI["schemas"]["Pack"];
type HymnView = OPENAPI["schemas"]["HymnView"];

export default memo(function HomePage() {
  // used for skeleton
  const [hymnPacks, setHymnPacks] = useState<Pack[]>([]);
  const [lastViewedHymns, setLastViewedHymns] = useState<HymnView[]>([]);
  const lastViewedHymnsUuids = useHymnosState.getState().lastViewedHymns;
  const [loadingData, setLoadingData] = useState(false);
  const { db } = usePGliteContext();
  const importUserDataStatus = useHymnosState(
    (state) => state.importUserDataStatus,
  );

  // Fetch hymn packs from backend
  useEffect(() => {
    setLoadingData(true);
    (async () => {
      const packs = await getAllPacks(db);
      const lvHymns = await getHymnsUsingId(db, lastViewedHymnsUuids);
      setHymnPacks(packs);
      setLastViewedHymns(lvHymns);
      setLoadingData(false);
    })();
  }, []);

  // refresh packs in-case importing is happening
  useEffect(() => {
    if (importUserDataStatus === "inprogress") {
      setLoadingData(true);
    } else if (importUserDataStatus === "done") {
      (async () => {
        await refreshPacks();
        setLoadingData(false);
      })();
    }
  }, [importUserDataStatus]);

  const refreshPacks = async () => {
    const packs = await getAllPacks(db);
    setHymnPacks(packs);
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
              toggleFullScreen();
              router.push(
                `/presentation/${item._hymn_uuid}?startSlide=${item._slide_uuid}`,
              );
            } else {
              router.push(`/hymn/${item._hymn_uuid}`);
            }
          }}
        />
      </View>
      {/* Library Section */}
      <ScrollView contentContainerClassName="gap-y-4 min-h-80">
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
            isLoading={loadingData}
            skeletonElement={renderSkeletons()}
            emptyResultsElement={<></>}
            onCardPress={(item) => {
              toggleFullScreen();
              router.navigate(`/presentation/${item.id}`);
            }}
            renderCardDescription={(item) =>
              `المؤلف: ${item.author || "غير محدد"}\nالملحن: ${item.composer || "غير محدد"}`
            }
          />
        </View>
      </ScrollView>
    </>
  );
});
