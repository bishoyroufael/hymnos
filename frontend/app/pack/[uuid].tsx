import ConfirmModal from "@components/base/ConfirmModal";
import EditableTextInput from "@components/base/EditableTextInput";
import HymnosText from "@components/base/HymnosText";
import Loader from "@components/base/Loader";
import SearchBar from "@components/base/SearchBar";
import ToolBox from "@components/base/ToolBox";
import { delete_pack_safe } from "@db/crud/delete";
import { get_pack_using_id_paged } from "@db/crud/read";
import { upset_pack_safe } from "@db/crud/update";
import { ContentType, components as OPENAPI } from "@db/models";
import { export_pack, zipBlobsAndDownload } from "@db/utils/export";
import Feather from "@expo/vector-icons/Feather";
import { emitError, emitInfo, emitWarning } from "@utils/notification";
import { shareText } from "@utils/sharing";
import { usePGliteContext } from "context/PGliteContext";
import { router, useLocalSearchParams } from "expo-router";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, Pressable, View } from "react-native";
import { useConfirmModal } from "../../hooks/useConfirmModal";

type HymnView = OPENAPI["schemas"]["HymnView"];
type PackItemView = OPENAPI["schemas"]["PackItemView"];
type PackView = OPENAPI["schemas"]["PackView"];

export default function HymnPack() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  if (uuid == null) {
    router.navigate("/notfound");
    return null;
  }

  const { db } = usePGliteContext();
  // const [searchQuery, setSearchQuery] = useState("");
  const [pack, setPack] = useState<PackView | null>(null);
  const [packBackup, setPackBackup] = useState<PackView | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [isAddingHymn, setIsAddingHymn] = useState(false);
  const [isEditingPack, setIsEditingPack] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const confirmModal = useConfirmModal();

  const numColumns = Dimensions.get("screen").width > 768 ? 5 : 1;
  const PAGE_SIZE = Dimensions.get("screen").width > 768 ? 20 : 10;

  // 5 columns for md and large else 1 columns
  const renderItem = ({ item }: { item: PackItemView }) => (
    <View className="border-2 border-gray-200 hover:border-gray-300 flex flex-row w-full md:w-[18%] items-center p-2 gap-1 bg-gray-100 hover:bg-gray-200 duration-100 rounded-lg">
      {isEditingPack && (
        <Pressable
          onPress={() => {
            confirmModal.show(() => {
              // We need to reload page to re-fetch paging
              // todo: find if there's a better way
              const updatedPack = {
                ...pack,
                items: pack.items.filter((pi) => pi.id != item.id),
              };
              upset_pack_safe(db, updatedPack).then((newPack) => {
                setIsEditingPack(false);
                setPack(newPack);
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
          router.navigate(
            item.type == ContentType.hymn ? `/hymn/${item.id}` : `/presentation/${item.id}`,
          );
        }}
      >
        {/* todo: figure out what to render for other views */}
        <HymnosText>{(item.content as HymnView).name}</HymnosText>
      </Pressable>
    </View>
  );

  const handleExport = () => {
    setIsExporting(true);
    export_pack(db, uuid).then((blobs) => {
      zipBlobsAndDownload(blobs, uuid);
      setIsExporting(false);
    });
  };

  const handleInputChange = (key: string, value: string) => {
    setPack((prev) => ({ ...prev, [key]: value }));
  };

  // Fetch hymn pack details from backend
  useEffect(() => {
    get_pack_using_id_paged(db, uuid, currentPage, PAGE_SIZE)
      .then((pack) => {
        setPack(pack);
        setPackBackup(_.cloneDeep(pack));
        // refreshHymnsInPage(pack, pagingMetaData.currentPage);
      })
      .catch((e) => {
        console.log(e);
        router.navigate("/notfound");
      });
  }, [currentPage]);

  if (!pack || isExporting) {
    return <Loader />;
  }

  const handleDeletePack = () => {
    delete_pack_safe(db, pack.id).then(() => {
      setIsEditingPack(false);
      emitInfo("تم مسح مكتبه الترانيم، جاري العوده الي الرئيسيه..");
      router.navigate("/");
    });
  };
  const handleCancel = () => {
    setPack(_.cloneDeep(packBackup));
    setIsEditingPack(false);
  };
  const handleSubmit = () => {
    if (pack.name.trim().length < 10) {
      emitError("Hymn title should have more than 10 characters");
      return;
    }
    if (pack.description.trim().length < 20) {
      emitError("Hymn description should have more than 10 characters");
      return;
    }
    if (pack.author.trim().length < 10) {
      emitError("Hymn author should have more than 10 characters");
      return;
    }
    upset_pack_safe(db, pack).then((updatedPack) => {
      setIsEditingPack(false);
      setPack(updatedPack);
      setPackBackup(_.cloneDeep(updatedPack));
    });
  };
  const handleOnEdit = () => {
    setIsEditingPack(true);
  };

  const handleShare = () => {
    shareText(pack.name, window.location.href);
  };

  return (
    <>
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
            refKey={"name"}
            value={pack.name}
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
            value={pack.description}
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
            value={pack.author}
            isEditing={isEditingPack}
            className={`flex-1 pt-2 pb-2 outline-none text-gray-500 ${isEditingPack ? "animate-pulse" : ""}`}
            onUpdateText={handleInputChange}
          />
        </View>

        {/* <HymnosText className="text-gray-500">اصدار: {pack.version}</HymnosText> */}
        <HymnosText className="text-gray-500">
          عدد المحتويات: {pack.pagination.total_items}
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
            المحتويات في هذه المكتبه:
          </HymnosText>
        </View>

        {isAddingHymn ? (
          <View className="h-[70vh]">
            <SearchBar
              db={db}
              onPressItemCallback={(item) => {
                setPack((prev) => {
                  const foundIdx = prev.items.findIndex((itm) => {
                    return itm.id == item._resource_uuid;
                  });

                  if (foundIdx != -1) {
                    emitWarning("موجود بالفعل في المكتبه!");
                    return prev;
                  }
                  const withAddedContent = prev;
                  const packItemView: PackItemView = {
                    id: item._resource_uuid,
                    type: ContentType.hymn,
                  };
                  withAddedContent.items.push(packItemView);

                  upset_pack_safe(db, withAddedContent).then((newPack) => {
                    emitInfo("تم الإضافه الي المكتبه بنجاح!");
                    setPack(newPack);
                  });
                  return withAddedContent;
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
              data={pack.items}
              keyExtractor={(item) => item.id}
              contentContainerClassName="gap-4 flex-1"
              renderItem={renderItem}
            />
            <View className="flex flex-row justify-between items-center p-4">
              <Pressable
                disabled={pack.pagination.is_first_page}
                onPress={() => {
                  if (pack.pagination.has_previous) {
                    setCurrentPage((prev) => prev - 1);
                  }
                }}
              >
                <Feather
                  name="chevron-left"
                  size={30}
                  className={`${pack.pagination.is_first_page ? "text-gray-400" : "text-gray-500 hover:scale-110 hover:text-gray-600 duration-100"}`}
                />
              </Pressable>
              <HymnosText>
                Page: {pack.pagination.current_page} -{" "}
                {pack.pagination.last_page}{" "}
              </HymnosText>
              <Pressable
                disabled={pack.pagination.is_last_page}
                onPress={() => {
                  if (pack.pagination.has_next) {
                    setCurrentPage((prev) => prev + 1);
                  }
                }}
              >
                <Feather
                  name="chevron-right"
                  size={30}
                  className={`${pack.pagination.is_last_page ? "text-gray-400" : "text-gray-500 hover:scale-110 hover:text-gray-600 duration-100"}`}
                />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </>
  );
}
