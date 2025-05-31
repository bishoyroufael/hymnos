import HymnosPageWrapper from "@components/base/HymnosPageWrapper";
import ConfirmModal from "@components/base/ConfirmModal";
import EditableTextInput from "@components/base/EditableTextInput";
import ToolBox from "@components/base/ToolBox";
import HymnosText from "@components/base/HymnosText";
import Loader from "@components/base/Loader";
import SearchBar from "@components/base/SearchBar";
import {
  delete_pack_by_uuid,
  DEXIE_VERSION,
  export_pack,
  get_pack_by_uuid,
  get_pack_hymns_paged,
  SIZE_PER_PAGE,
  update_or_add_pack,
} from "@db/dexie";
import { Hymn, HymnsPack } from "@db/models";
import Feather from "@expo/vector-icons/Feather";
import { HymnosDataExport, MetaData } from "@utils/exporter";
import { emitError, emitInfo, emitWarning } from "@utils/notification";
import Constants from "expo-constants";
import { router, useLocalSearchParams } from "expo-router";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, Pressable, View } from "react-native";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { shareText } from "@utils/sharing";

interface PagingMetaData {
  currentPage: number;
  maxPage: number;
}

export default function HymnPack() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  if (uuid == null) {
    router.navigate("/notfound");
    return null;
  }

  // const [searchQuery, setSearchQuery] = useState("");
  const [hymnPack, setHymnPack] = useState<HymnsPack | null>(null);
  const [hymnPackBackup, setHymnPackBackup] = useState<HymnsPack | null>(null);
  const [hymnsInPage, setHymnsInPage] = useState<Hymn[]>([]);
  const [pagingMetaData, setPagingMetaData] = useState<PagingMetaData>({
    currentPage: 1,
    maxPage: 1,
  });
  const [isAddingHymn, setIsAddingHymn] = useState(false);
  const [isEditingPack, setIsEditingPack] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const confirmModal = useConfirmModal();

  const numColumns = Dimensions.get("screen").width > 768 ? 5 : 1;
  const pageSize =
    Dimensions.get("screen").width > 768 ? SIZE_PER_PAGE * 3 : SIZE_PER_PAGE;

  // 5 columns for md and large else 1 columns
  const renderItem = ({ item }) => (
    <View className="border-2 border-gray-200 hover:border-gray-300 flex flex-row w-full md:w-[18%] items-center p-2 gap-1 bg-gray-100 hover:bg-gray-200 duration-100 rounded-lg">
      {isEditingPack && (
        <Pressable
          onPress={() => {
            confirmModal.show(() => {
              // We need to reload page to re-fetch paging
              // todo: find if there's a better way
              const updatedPack = {
                ...hymnPack,
                hymns_uuid: hymnPack.hymns_uuid.filter((id) => id != item.uuid),
              };
              update_or_add_pack(updatedPack).then(() => {
                setIsEditingPack(false);
                setHymnPack(updatedPack);
                refreshHymnsInPage(updatedPack, pagingMetaData.currentPage);
              });
            });
          }}
        >
          <Feather
            name="trash"
            size={20}
            className={
              "text-red-500 hover:text-red-600 duration-100 animate-pulse"
            }
          />
        </Pressable>
      )}
      <Pressable
        className="p-4 rounded-lg flex-1"
        onPress={() => {
          router.navigate(`/hymn/details?uuid=${item.uuid}`);
        }}
      >
        <HymnosText>{item.title}</HymnosText>
      </Pressable>
    </View>
  );

  const handleExport = () => {
    setIsExporting(true);
    export_pack(uuid)
      .then((data) => {
        const metadata: MetaData = {
          hymnos_version: Constants.expoConfig.version,
          dexie_version: DEXIE_VERSION.toString(),
          user_agent: window.navigator.userAgent,
        };
        const dataExport: HymnosDataExport = {
          hymns: data.hymns,
          packs: [data.pack],
          slides: data.slides,
          metadata: metadata,
        };
        const blob = new Blob([JSON.stringify(dataExport)], {
          type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `pack_export_${uuid}.json`;
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

  const handleInputChange = (key: string, value: string) => {
    setHymnPack((prev) => ({ ...prev, [key]: value }));
  };

  const refreshHymnsInPage = (pack: HymnsPack, page: number) => {
    get_pack_hymns_paged(uuid, page, pageSize).then((res) => {
      setHymnsInPage(res);
      setPagingMetaData({
        currentPage: page,
        maxPage: Math.ceil(pack.hymns_uuid.length / pageSize),
      });
    });
  };

  // Fetch hymn pack details from backend
  useEffect(() => {
    get_pack_by_uuid(uuid)
      .then((p) => {
        setHymnPack(p);
        setHymnPackBackup(_.cloneDeep(p));
        refreshHymnsInPage(p, pagingMetaData.currentPage);
      })
      .catch((e) => {
        console.log(e);
        router.navigate("/notfound");
      });
  }, []);

  if (!hymnPack || isExporting) {
    return <Loader />;
  }

  const handleDeletePack = () => {
    delete_pack_by_uuid(uuid).then(() => {
      setIsEditingPack(false);
      emitInfo("تم مسح مكتبه الترانيم، جاري العوده الي الرئيسيه..", () =>
        router.navigate("/"),
      );
    });
  };
  const handleCancel = () => {
    setHymnPack(_.cloneDeep(hymnPackBackup));
    setIsEditingPack(false);
  };
  const handleSubmit = () => {
    if (hymnPack.title.trim().length < 10) {
      emitError("Hymn title should have more than 10 characters");
      return;
    }
    if (hymnPack.description.trim().length < 20) {
      emitError("Hymn description should have more than 10 characters");
      return;
    }
    if (hymnPack.author.trim().length < 10) {
      emitError("Hymn author should have more than 10 characters");
      return;
    }
    update_or_add_pack(hymnPack).then(() => {
      setIsEditingPack(false);
    });
  };
  const handleOnEdit = () => {
    setIsEditingPack(true);
  };

  const handleShare = () => {
    shareText(hymnPack.title, window.location.href);
  };

  return (
    <HymnosPageWrapper>
      {/* Hymn Pack Information */}
      <View className="gap-2">
        <ConfirmModal
          visible={confirmModal.visible}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.hide}
        />

        {/* Title and ToolBox */}
        <View className="flex flex-row-reverse items-center gap-2 flex-wrap">
          <Feather name="folder" size={30} className="text-gray-800" />
          <EditableTextInput
            rtl
            placeholder="اكتب اسم المكتبه.."
            refKey={"title"}
            value={hymnPack.title}
            isEditing={isEditingPack}
            className={`flex-1 max-w-full flex-wrap text-3xl font-semibold outline-none text-gray-800 ${isEditingPack ? "animate-pulse" : ""}`}
            onUpdateText={handleInputChange}
          />

          <ToolBox
            showOnlyIf={isEditingPack}
            className="flex flex-row"
            actions={[
              {
                key: "delete",
                iconName: "trash",
                onPress: handleDeletePack,
                confirm: true,
                iconClassName: "text-red-500 hover:text-red-600 duration-100",
              },
              {
                key: "cancel",
                iconName: "x",
                onPress: handleCancel,
                iconClassName: "text-red-400 hover:text-red-500 duration-100",
              },
              {
                key: "submit",
                iconName: "check",
                onPress: handleSubmit,
                confirm: true,
                iconClassName:
                  "text-green-400 hover:text-green-500 duration-100",
              },
            ]}
          />

          <ToolBox
            showOnlyIf={!isEditingPack}
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

        {/* Description of Pack */}
        <View className="flex flex-col gap-2">
          <View className="flex flex-row-reverse gap-2 items-center">
            <Feather name="edit-3" size={20} className="text-gray-800" />
            <HymnosText className="text-gray-800 font-medium">
              وصف المكتبه:
            </HymnosText>
          </View>
          <EditableTextInput
            rtl
            numberOfLines={5}
            placeholder="اكتب وصف المكتبه.."
            refKey={"description"}
            value={hymnPack.description}
            isEditing={isEditingPack}
            className={`flex-1 border border-gray-200 p-2 rounded-md outline-none text-gray-700 ${isEditingPack ? "animate-pulse" : ""}`}
            onUpdateText={handleInputChange}
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
            value={hymnPack.author}
            isEditing={isEditingPack}
            className={`flex-1 pt-2 pb-2 outline-none text-gray-500 ${isEditingPack ? "animate-pulse" : ""}`}
            onUpdateText={handleInputChange}
          />
        </View>

        <HymnosText className="text-gray-500">
          اصدار: {hymnPack.version}
        </HymnosText>
        <HymnosText className="text-gray-500">
          عدد الترانيم: {hymnPack.hymns_uuid.length}
        </HymnosText>
      </View>

      {/* Hymn Titles */}
      <View className="gap-4 flex-grow">
        <View className="flex flex-row items-center justify-between">
          <Pressable
            onPress={() => {
              setIsAddingHymn(!isAddingHymn);
            }}
          >
            <Feather
              name={isAddingHymn ? "x-circle" : "plus-circle"}
              size={30}
              className="text-green-400 hover:text-green-500 duration-100"
            />
          </Pressable>
          <HymnosText className="text-2xl font-medium">
            الترانيم في هذه المكتبه
          </HymnosText>
        </View>

        {isAddingHymn ? (
          <View className="h-[70vh]">
            <SearchBar
              onPressItemCallback={(item) => {
                setHymnPack((prev) => {
                  if (prev.hymns_uuid.includes(item.hymn_uuid)) {
                    emitWarning("الترنيمه موجوده في المكتبه بالفعل!");
                    return prev;
                  }
                  const withAddedHymn = prev;
                  withAddedHymn.hymns_uuid.push(item.hymn_uuid);
                  update_or_add_pack(withAddedHymn).then(() => {
                    emitInfo("تم اضافه الترنيمه الي المكتبه!");
                    refreshHymnsInPage(
                      withAddedHymn,
                      pagingMetaData.currentPage,
                    );
                  });
                  return withAddedHymn;
                });
              }}
            />
          </View>
        ) : (
          <View className="flex-grow">
            <FlatList
              numColumns={numColumns}
              key={numColumns}
              columnWrapperClassName={numColumns == 1 ? "" : "justify-between"}
              horizontal={false}
              data={hymnsInPage}
              keyExtractor={(item) => item.uuid}
              contentContainerClassName="gap-4 flex-1"
              renderItem={renderItem}
            />
            <View className="flex flex-row justify-between items-center p-4">
              <Pressable
                disabled={pagingMetaData.currentPage == 1}
                onPress={() => {
                  refreshHymnsInPage(hymnPack, pagingMetaData.currentPage - 1);
                }}
              >
                <Feather
                  name="chevron-left"
                  size={30}
                  className={`${pagingMetaData.currentPage == 1 ? "text-gray-400" : "text-gray-500 hover:scale-110 hover:text-gray-600 duration-100"}`}
                />
              </Pressable>
              <HymnosText>
                Page: {pagingMetaData.currentPage} -{" "}
                {pagingMetaData.maxPage}{" "}
              </HymnosText>
              <Pressable
                disabled={pagingMetaData.currentPage == pagingMetaData.maxPage}
                onPress={() => {
                  refreshHymnsInPage(hymnPack, pagingMetaData.currentPage + 1);
                }}
              >
                <Feather
                  name="chevron-right"
                  size={30}
                  className={`${pagingMetaData.currentPage == pagingMetaData.maxPage ? "text-gray-400" : "text-gray-500 hover:scale-110 hover:text-gray-600 duration-100"}`}
                />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </HymnosPageWrapper>
  );
}
