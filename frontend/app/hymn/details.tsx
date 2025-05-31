import HymnosPageWrapper from "@components/base/HymnosPageWrapper";
import ConfirmModal from "@components/base/ConfirmModal";
import EditableTextInput from "@components/base/EditableTextInput";
import ToolBox from "@components/base/ToolBox";
import HymnosText from "@components/base/HymnosText";
import Loader from "@components/base/Loader";
import {
  delete_hymn_by_uuid,
  DEXIE_VERSION,
  export_hymn,
  get_hymn_by_uuid,
  get_slides_of_hymn,
  update_or_add_hymn,
} from "@db/dexie";
import { Hymn, Slide } from "@db/models";
import Feather from "@expo/vector-icons/Feather";
import { HymnosDataExport, MetaData } from "@utils/exporter";
import { emitError, emitInfo } from "@utils/notification";
import Constants from "expo-constants";
import { router, useLocalSearchParams } from "expo-router";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { shareText } from "@utils/sharing";
import { toggleFullScreen } from "@utils/ui";
import { useGlobalLocalStorage } from "@hooks/useGlobalLocalStorage";

export default function HymnDetails() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  if (uuid == null) {
    router.navigate("/notfound");
    return null;
  }

  const lastViewedStorage = useGlobalLocalStorage<string[]>(
    "lastViewedHymns",
    [],
  );
  const [hymn, setHymn] = useState<Hymn | null>(null);
  const [hymnBackup, setHymnBackup] = useState<Hymn | null>(null);
  const [slidesInHymn, setSlidesInHymn] = useState<Slide[]>([]);
  const [isEditingHymn, setIsEditingHymn] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleInputChange = (key: string, value: string) => {
    setHymn((prev) => ({ ...prev, [key]: value }));
  };

  const confirmModal = useConfirmModal();

  const renderItem = ({ item }: { item: Slide }) => (
    <View
      className={`border-2 border-gray-200 flex flex-row w-full p-1 bg-gray-100 ${!isEditingHymn ? "hover:bg-gray-200 hover:border-gray-300 duration-100" : ""} rounded-lg`}
    >
      <Pressable
        disabled={isEditingHymn}
        className="p-4 rounded-lg flex-1"
        onPress={() => {
          toggleFullScreen();
          router.navigate(
            `/hymn/presentation?uuid=${uuid}&startSlide=${item.uuid}`,
          );
        }}
      >
        <HymnosText
          className={`whitespace-pre-line text-3xl font-light text-center ${isEditingHymn ? "text-gray-500" : "text-gray-800"}`}
        >
          {item.lines.join("\n")}
        </HymnosText>
      </Pressable>
    </View>
  );

  const handleExport = () => {
    setIsExporting(true);
    export_hymn(uuid)
      .then((data) => {
        const metadata: MetaData = {
          hymnos_version: Constants.expoConfig.version,
          dexie_version: DEXIE_VERSION.toString(),
          user_agent: window.navigator.userAgent,
        };
        const dataExport: HymnosDataExport = {
          hymns: [data.hymn],
          packs: [],
          slides: data.slides,
          metadata: metadata,
        };
        const blob = new Blob([JSON.stringify(dataExport)], {
          type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `hymn_export_${uuid}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up memory

        setIsExporting(false);
      })
      .catch((error) => {
        console.log(error);
        setIsExporting(false); // also ensure false on error
      });
  };

  // Fetch hymn pack details from backend
  useEffect(() => {
    get_hymn_by_uuid(uuid)
      .then((h) => {
        setHymn(h);
        setHymnBackup(_.cloneDeep(h));
        get_slides_of_hymn(uuid).then((slides) => {
          setSlidesInHymn(slides);
        });
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
    delete_hymn_by_uuid(uuid).then(() => {
      setIsEditingHymn(false);
      const currentLastViewed = lastViewedStorage.get();
      lastViewedStorage.set(_.without(currentLastViewed, uuid));
      emitInfo("تم مسح الترنيمه، جاري العوده الي الرئيسيه..", () =>
        router.navigate("/"),
      );
    });
  };
  const handleCancel = () => {
    setHymn(_.cloneDeep(hymnBackup));
    setIsEditingHymn(false);
  };
  const handleSubmit = () => {
    if (hymn.title.trim().length < 10) {
      emitError("Hymn title should have more than 10 characters");
      return;
    }
    update_or_add_hymn(hymn).then(() => {
      setIsEditingHymn(false);
    });
  };

  function handleShare(): void {
    shareText(hymn.title, window.location.href);
  }

  function handleOnEdit(): void {
    setIsEditingHymn(true);
  }

  return (
    <HymnosPageWrapper>
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
            refKey={"title"}
            value={hymn.title}
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
            value={hymn.author}
            isEditing={isEditingHymn}
            className={`text-gray-800 outline-none ${isEditingHymn ? "animate-pulse" : ""}`}
            valueIfEmpty="مجهول"
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
            value={hymn.composer}
            isEditing={isEditingHymn}
            className={`text-gray-800 outline-none ${isEditingHymn ? "animate-pulse" : ""}`}
            valueIfEmpty="مجهول"
            onUpdateText={handleInputChange}
          />
        </View>
      </View>

      {/* Hymn Titles */}
      <View className="gap-4 flex-grow">
        <HymnosText className="text-2xl font-semibold text-gray-800">
          كلام الترنيمه
        </HymnosText>
        {slidesInHymn.length != 0 ? (
          <FlatList
            data={slidesInHymn}
            keyExtractor={(item) => item.uuid}
            contentContainerClassName="gap-y-2"
            renderItem={renderItem}
          />
        ) : (
          <Pressable
            onPress={() => {
              toggleFullScreen();
              router.navigate(`/hymn/presentation?uuid=${hymn.uuid}&isNew`);
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
    </HymnosPageWrapper>
  );
}
