import HymnosPageWrapper from "@components/base/HymnosPageWrapper";
import HymnosText from "@components/base/HymnosText";
import ProgressBar from "@components/base/ProgressBar";
import SearchBar from "@components/base/SearchBar";
import {
  HorizontalHymnList,
  renderSkeletons,
} from "@components/fractions/home-screen";
import {
  get_all_packs,
  get_hymns_by_uuid,
  insert_hymns_and_packs,
  is_db_empty,
} from "@db/dexie";
import { getLastViewedHymns } from "@db/localstorage";
import { Hymn, HymnsPack, Slide } from "@db/models";
import Feather from "@expo/vector-icons/Feather";
import { AxiosResponse } from "axios";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as fzstd from "fzstd";
import React, { memo, useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import "../assets/global.css";
import * as API from "../generated/";
import useHymnosState from "../global";

const HymnosAPI = new API.DefaultApi(
  new API.Configuration({ basePath: "https://yellow-apples-like.loca.lt" }),
);

export default memo(function HomePage() {
  // used for skeleton
  const [hymnPacks, setHymnPacks] = useState<HymnsPack[]>([]);
  // we should think of a mechanism how to store the last viewed hymns in the database
  const [lastViewedHymns, setLastViewedHymns] = useState<Hymn[]>([]);
  const [isFetchingFromRemote, setIsFetchingFromRemote] =
    useState<boolean>(false);

  // non-reactive for passing to fetchDb, re-renders <ProgressBar/> only
  const syncProgressCallback =
    useHymnosState.getState().setSyncProgressPercentage;

  const fetchInitialData = useCallback(() => {
    (async () => {
      // we shouldn't fetch anything if the database contain hymns
      if (!(await is_db_empty())) {
        // const allPacks = await get_all_packs();
        // setHymnPacks(allPacks);
        await updatePacks();

        const lastViewedHymnsUuids = getLastViewedHymns();
        // removes undefined elements from previously deleted items
        const lastViewedHymns = await get_hymns_by_uuid(lastViewedHymnsUuids);
        // console.log(lastViewedHymns)
        setLastViewedHymns(lastViewedHymns);
        return;
      }
      setIsFetchingFromRemote(true);
      HymnosAPI.downloadLatestJsonDataLatestDownloadGet({
        responseType: "arraybuffer",
      }).then(
        (res) => {
          // Decompress response and add to database
          const buffer: ArrayBuffer = (res as AxiosResponse<any, ArrayBuffer>)
            .data;
          const compressed = new Uint8Array(buffer);
          const decompressed = fzstd.decompress(compressed);
          // convert decompressed buffer to json
          const json: API.HymnosItems = JSON.parse(
            new TextDecoder().decode(decompressed),
          );

          const startTime = performance.now();
          // todo: taking too much time, should be chunked up..
          insert_hymns_and_packs(
            json.hymns,
            json.packs,
            json.slides,
            1000,
            syncProgressCallback,
          ).then(() => {
            const endTime = performance.now();
            console.log(
              `Call to bulk import took ${endTime - startTime} milliseconds`,
            );
            // Add pack to list if not present
            setHymnPacks(json.packs);
            setIsFetchingFromRemote(false);
          });
        },
        (r) => {
          setIsFetchingFromRemote(false);
          console.log(r);
        },
      );
    })();
  }, []);

  // Fetch hymn packs from backend
  useEffect(() => {
    fetchInitialData();
    // return () => {
    //   console.log("cleanup called!");
    // };
  }, [fetchInitialData]);

  const updatePacks = async () => {
    const new_updated_packs = await get_all_packs();
    setHymnPacks(new_updated_packs);
  };
  return (
    <HymnosPageWrapper onUploadDataCallback={updatePacks}>
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
