import HymnosPageWrapper from "@components/base/HymnosPageWrapper";
import ConfirmModal from "@components/base/ConfirmModal";
import EditableTextInput from "@components/base/EditableTextInput";
import ToolBox from "@components/base/ToolBox";
import HymnosText from "@components/base/HymnosText";
import Loader from "@components/base/Loader";
import { DEXIE_VERSION } from "@db/base";
// import { Hymn, Slide } from "@db/legacy_models";
import Feather from "@expo/vector-icons/Feather";
import { emitError, emitInfo } from "@utils/notification";
import Constants from "expo-constants";
import { router, useLocalSearchParams } from "expo-router";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { shareText } from "@utils/sharing";
import { toggleFullScreen } from "@utils/ui";
import { get_hymn_using_id } from "@db/crud/read";
import useHymnosState from "global";
import { usePGliteContext } from "context/PGliteContext";
import { components as OPENAPI } from "@db/models";
import { upsert_hymn_safe } from "@db/crud/update";
import { delete_hymn_safe } from "@db/crud/delete";
import { export_hymn, zipBlobsAndDownload } from "@db/utils/export";

type HymnView = OPENAPI["schemas"]["HymnView"];
type SlideView = OPENAPI["schemas"]["SlideView"];

export default function HymnDetails() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  if (uuid == null) {
    router.navigate("/notfound");
    return null;
  }

  const { db } = usePGliteContext();
  const lastViewedHymnsUuids = useHymnosState.getState().lastViewedHymns;
  const setLastViewedHymnsUuids = useHymnosState.getState().setLastViewedHymns;

  const [hymn, setHymn] = useState<HymnView | null>(null);
  const [hymnBackup, setHymnBackup] = useState<HymnView | null>(null);
  const [isEditingHymn, setIsEditingHymn] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleInputChange = (key: string, value: string) => {
    setHymn((prev) => ({ ...prev, [key]: value }));
  };

  const confirmModal = useConfirmModal();

  const renderItem = ({ item }: { item: SlideView }) => (
    <View
      className={`border-2 border-gray-200 flex flex-row w-full p-1 bg-gray-100 ${!isEditingHymn ? "hover:bg-gray-200 hover:border-gray-300 duration-100" : ""} rounded-lg`}
    >
      <Pressable
        disabled={isEditingHymn}
        className="p-4 rounded-lg flex-1"
        onPress={() => {
          toggleFullScreen();
          router.navigate(`/presentation/${uuid}?startSlide=${item.slide_id}`);
        }}
      >
        <HymnosText
          className={`whitespace-pre-line text-3xl font-light text-center ${isEditingHymn ? "text-gray-500" : "text-gray-800"}`}
        >
          {item.columns[0]?.header ? item.columns[0].header + "\n" : ""}
          {item.columns[0]?.content}
        </HymnosText>
      </Pressable>
    </View>
  );

  const handleExport = () => {
    setIsExporting(true);
    export_hymn(db, uuid).then((blobs) => {
      zipBlobsAndDownload(blobs, uuid).then(() => {
        setIsExporting(false);
      });
    });
  };

  // Fetch hymn pack details from backend
  useEffect(() => {
    get_hymn_using_id(db, uuid)
      .then((h) => {
        // console.log(h);
        setHymn(h);
        setHymnBackup(_.cloneDeep(h));
      })
      .catch((e) => {
        console.log(e);
        router.navigate("/notfound");
      });
  }, []);

  if (!hymn || isExporting) {
    return <Loader />;
  }

  const handleDeleteHymn = () => {
    delete_hymn_safe(db, hymn.id).then(() => {
      setIsEditingHymn(false);
      setLastViewedHymnsUuids(_.without(lastViewedHymnsUuids, uuid));
      emitInfo("تم مسح الترنيمه، جاري العوده الي الرئيسيه..");
      router.navigate("/");
    });
  };
  const handleCancel = () => {
    setHymn(_.cloneDeep(hymnBackup));
    setIsEditingHymn(false);
  };
  const handleSubmit = () => {
    if (hymn.name.trim().length < 10) {
      emitError("يجب ان يكون عنوان الترنيمه مكون من عشره حروف علي الاقل..");
      return;
    }

    upsert_hymn_safe(db, hymn).then(() => {
      setIsEditingHymn(false);
      emitInfo("تم التعديل بنجاح!");
    });
  };

  function handleShare(): void {
    shareText(hymn.name, window.location.href);
  }

  function handleOnEdit(): void {
    setIsEditingHymn(true);
  }

  return (
    <>
      <ConfirmModal
        visible={confirmModal.visible}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.hide}
      />
      {/* Hymn Pack Information */}
      <View className="gap-2">
        <View className="flex flex-row-reverse items-center gap-2 flex-wrap">
          <Feather name="music" size={30} className="text-gray-800" />
          <EditableTextInput
            rtl
            placeholder="اكتب اسم الترنيمه.."
            refKey={"name"}
            value={hymn.name || ""}
            isEditing={isEditingHymn}
            className={`flex-1 max-w-full text-3xl font-semibold pt-2 pb-2 outline-none text-gray-800 ${isEditingHymn ? "animate-pulse" : ""}`}
            onUpdateText={handleInputChange}
          />

          <ToolBox
            className="flex flex-row"
            showOnlyIf={isEditingHymn}
            actions={[
              {
                key: "delete",
                iconName: "trash",
                iconClassName: "text-red-500 hover:text-red-600 duration-100",
                confirm: true,
                onPress: handleDeleteHymn,
              },
              {
                key: "cancel",
                iconName: "x",
                iconClassName: "text-red-400 hover:text-red-500 duration-100",
                onPress: handleCancel,
              },
              {
                key: "submit",
                iconName: "check",
                iconClassName:
                  "text-green-400 hover:text-green-500 duration-100",
                confirm: true,
                onPress: handleSubmit,
              },
            ]}
          />

          <ToolBox
            showOnlyIf={!isEditingHymn}
            className="flex flex-row"
            actions={[
              {
                key: "export",
                iconName: "download",
                onPress: handleExport,
                iconClassName: "hover:text-blue-600 text-blue-500 duration-200",
              },
              {
                key: "share",
                iconName: "share-2",
                onPress: handleShare,
                iconClassName: "hover:text-blue-600 text-blue-500 duration-200",
              },
              {
                key: "edit",
                iconName: "edit",
                onPress: handleOnEdit,
                iconClassName:
                  "hover:text-green-600 text-green-500 duration-200",
              },
            ]}
          />
        </View>
        {/* Author */}
        <View className="flex flex-row-reverse gap-2 items-center">
          <Feather name="user" size={20} className="text-gray-800" />
          <HymnosText className="text-gray-800 font-medium">المؤلف:</HymnosText>
          <EditableTextInput
            rtl
            placeholder="اكتب اسم المؤلف.."
            refKey={"author"}
            value={hymn.author || ""}
            isEditing={isEditingHymn}
            className={`text-gray-800 outline-none ${isEditingHymn ? "animate-pulse" : ""}`}
            valueIfEmpty="غير محدد"
            onUpdateText={handleInputChange}
          />
        </View>
        {/* Composer */}
        <View className="flex flex-row-reverse gap-2 items-center">
          <Feather name="user" size={20} className="text-gray-800" />
          <HymnosText className="text-gray-800 font-medium">الملحن:</HymnosText>
          <EditableTextInput
            rtl
            placeholder="اكتب اسم الملحن.."
            refKey={"composer"}
            value={hymn.composer || ""}
            isEditing={isEditingHymn}
            className={`text-gray-800 outline-none ${isEditingHymn ? "animate-pulse" : ""}`}
            valueIfEmpty="غير محدد"
            onUpdateText={handleInputChange}
          />
        </View>
      </View>

      {/* Hymn Titles */}
      <View className="gap-4 flex-grow">
        <HymnosText className="text-2xl font-semibold text-gray-800">
          كلمات الترنيمه :
        </HymnosText>
        {hymn.slides.length != 0 ? (
          <FlatList
            data={hymn.slides}
            // it's okay to used index as key since order won't change
            // uuid doesn't work since chorus slides are repeated and their uuids will clash
            keyExtractor={(item, _idx) => _idx.toString()}
            contentContainerClassName="gap-y-2"
            renderItem={renderItem}
          />
        ) : (
          <Pressable
            onPress={() => {
              toggleFullScreen();
              router.navigate(`/presentation/${hymn.id}`);
            }}
            className="flex-1 flex justify-center self-center bg-gray-100 rounded-lg hover:bg-gray-200 w-full duration-100"
          >
            <HymnosText className="text-3xl text-center text-gray-800">
              اضف كلمات الترنيمه
            </HymnosText>
            <Feather
              name="plus"
              size={40}
              className="self-center text-gray-800"
            />
          </Pressable>
        )}
      </View>
    </>
  );
}
