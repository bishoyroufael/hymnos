import EditableTextInput from "@components/base/EditableTextInput";
import HymnosText from "@components/base/HymnosText";
import Loader from "@components/base/Loader";
import { get_bible_books_paged } from "@db/crud/read";
import { components as OPENAPI } from "@db/models";
import Feather from "@expo/vector-icons/Feather";
import useOrientation from "@hooks/useOrientation";
import { usePGliteContext } from "context/PGliteContext";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, Pressable, View } from "react-native";

type BibleBooksPagedView = OPENAPI["schemas"]["BibleBooksPagedView"];
type BibleBook = OPENAPI["schemas"]["BibleBook"];

export default function Bible() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  if (uuid == null) {
    router.navigate("/notfound");
    return null;
  }

  const { orientation } = useOrientation();
  const { db } = usePGliteContext();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [bible, setBible] = useState<BibleBooksPagedView>();
  const numColumns = Dimensions.get("screen").width > 768 ? 5 : 1;
  const PAGE_SIZE = Dimensions.get("screen").width > 768 ? 20 : 10;

  // 5 columns for md and large else 1 columns
  const renderItem = ({ item }: { item: BibleBook }) => (
    <View className="border-2 border-gray-200 hover:border-gray-300 flex flex-row w-full md:w-[18%] items-center p-2 gap-1 bg-gray-100 hover:bg-gray-200 duration-100 rounded-lg">
      <Pressable
        className="p-4 rounded-lg flex-1"
        onPress={() => {
          router.navigate(`/book/${item.id}`);
        }}
      >
        {/* todo: figure out what to render for other views */}
        <HymnosText>{item.name_lang}</HymnosText>
      </Pressable>
    </View>
  );

  // Fetch bible books
  useEffect(() => {
    get_bible_books_paged(db, uuid, currentPage, PAGE_SIZE)
      .then((bible) => {
        setBible(bible);
      })
      .catch((e) => {
        console.log(e);
        router.navigate("/notfound");
      });
  }, [currentPage, orientation]);

  if (!bible) {
    return <Loader />;
  }

  return (
    <>
      {/* Hymn Pack Information */}
      <View className="gap-2">
        {/* Title and ToolBox */}
        <View className="flex flex-row-reverse items-center gap-2 flex-wrap">
          <Feather name="book" size={30} className="text-gray-800" />
          <EditableTextInput
            rtl
            placeholder=""
            refKey={"name"}
            value={`الكتاب المقدس  (${bible.translation_data.name})`}
            isEditing={false}
            className={`flex-1 max-w-full flex-wrap text-3xl font-semibold outline-none text-gray-800`}
            onUpdateText={() => {}}
          />
        </View>

        {/* Description of Pack */}
        <View className="flex flex-col gap-2">
          <View className="flex flex-row-reverse gap-2 items-center">
            <Feather name="edit-3" size={20} className="text-gray-800" />
            <HymnosText className="text-gray-800 font-medium">
              الوصف:
            </HymnosText>
          </View>
          <EditableTextInput
            rtl
            numberOfLines={5}
            placeholder="اكتب وصف المكتبه.."
            refKey={"description"}
            value={"جميع حقوق النشر محفوظه لدي الناشر الاصلي"}
            isEditing={false}
            className={`flex-1 border border-gray-200 p-2 rounded-md outline-none text-gray-700`}
            onUpdateText={() => {}}
            multiline
          />
        </View>

        {/* Author of Pack */}
        <View className="flex flex-row-reverse gap-2 items-center">
          <Feather name="user" size={20} className="text-gray-800" />
          <HymnosText className="text-gray-800 font-medium">المؤلف:</HymnosText>
          <EditableTextInput
            rtl
            placeholder="اكتب مؤلف المكتبه.."
            refKey={"author"}
            value={"Hymnos"}
            isEditing={false}
            className={`flex-1 pt-2 pb-2 outline-none text-gray-500`}
            onUpdateText={() => {}}
          />
        </View>

        {/* <HymnosText className="text-gray-500">اصدار: {pack.version}</HymnosText> */}
        <HymnosText className="text-gray-500">
          عدد الأسفار: {bible.pagination.total_items}
        </HymnosText>
      </View>

      {/* Hymn Titles */}
      <View className="gap-4 flex-grow">
        <HymnosText className="text-2xl font-medium">الأسفار:</HymnosText>

        <View className="flex-grow">
          <FlatList
            numColumns={numColumns}
            key={numColumns}
            columnWrapperClassName={numColumns == 1 ? "" : "justify-between"}
            horizontal={false}
            data={bible.items}
            keyExtractor={(item) => item.id}
            contentContainerClassName="gap-4 flex-1"
            renderItem={renderItem}
          />
          <View className="flex flex-row justify-between items-center p-4">
            <Pressable
              disabled={bible.pagination.is_first_page}
              onPress={() => {
                if (bible.pagination.has_previous) {
                  setCurrentPage((prev) => prev - 1);
                }
              }}
            >
              <Feather
                name="chevron-left"
                size={30}
                className={`${bible.pagination.is_first_page ? "text-gray-400" : "text-gray-500 hover:scale-110 hover:text-gray-600 duration-100"}`}
              />
            </Pressable>
            <HymnosText>
              Page: {bible.pagination.current_page} -{" "}
              {bible.pagination.last_page}{" "}
            </HymnosText>
            <Pressable
              disabled={bible.pagination.is_last_page}
              onPress={() => {
                if (bible.pagination.has_next) {
                  setCurrentPage((prev) => prev + 1);
                }
              }}
            >
              <Feather
                name="chevron-right"
                size={30}
                className={`${bible.pagination.is_last_page ? "text-gray-400" : "text-gray-500 hover:scale-110 hover:text-gray-600 duration-100"}`}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}
