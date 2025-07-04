import HymnosText from "@components/base/HymnosText";
import PlusButton from "@components/base/PlusButton";
import ToolBox from "@components/base/ToolBox";
import SlideSettingsMenu from "@components/menus/SlideSettingsMenu";
import SlideColumn from "@fractions/presentation";
import {
  useData,
  useEditingMode,
  useSlideActions,
  useSlideNavigation,
  useUIState,
} from "@fractions/presentation/hooks";
import useAutoSizeTextArea from "@hooks/useAutoSizeTextArea";
import { usePGliteContext } from "context/PGliteContext";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Text } from "react-native";
import {
  NativeSyntheticEvent,
  Pressable,
  TextInputKeyPressEventData,
  View,
} from "react-native";
import useHymnosState from "../../global";
import { exitFullScreen, toggleFullScreen } from "@utils/ui";
import { usePresentationFonts } from "@hooks/usePresentationFonts";
import Loader from "@components/base/Loader";

export default function HymnPresentation() {
  const presentationSettings = useHymnosState(
    (state) => state.presentationSettings,
  );

  const { db } = usePGliteContext();

  const { uuid, startSlide } = useLocalSearchParams<{
    uuid: string;
    isNew: string;
    startSlide: string;
  }>();

  if (uuid == null) {
    router.navigate("/notfound");
    return null;
  }

  const { data, setData, currSlideIdx, setCurrSlideIdx } = useData(
    db,
    uuid,
    startSlide,
  );

  const {
    isEditingMode,
    setIsEditingMode,
    textAreaRef,
    handleOnEdit,
    cancelEditing,
    submitEdit,
    deleteSlide,
    focusTextAreaAndMoveCaretToEnd,
  } = useEditingMode(db, data, setData, currSlideIdx, setCurrSlideIdx);

  const {
    isSettingsMenuOpen,
    setIsSettingsMenuOpen,
    isPresentationSettingsIconShown,
    setIsPresentationSettingsIconShown,
    setEditToolboxModalOpen,
  } = useUIState();

  const { handleSlidePress, handleKeyEvent } = useSlideNavigation(
    data,
    currSlideIdx,
    setCurrSlideIdx,
    isEditingMode,
    textAreaRef,
    setIsPresentationSettingsIconShown,
    setIsSettingsMenuOpen,
  );

  const { handleShare, addSlideAt } = useSlideActions(
    data,
    currSlideIdx,
    setData,
    setCurrSlideIdx,
    focusTextAreaAndMoveCaretToEnd,
  );

  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (isEditingMode) return;
    handleKeyEvent(e.nativeEvent); // This would need to be passed from useSlideNavigation
  };

  const textAreaResizeRef = useAutoSizeTextArea([
    data,
    presentationSettings,
    currSlideIdx,
  ]);

  const renderItem = ({ item }) => (
    <SlideColumn
      presentationSettings={presentationSettings}
      key={item.id}
      id={item.id}
      ref={(r) => {
        [textAreaResizeRef, textAreaRef].forEach((ref: any) => {
          if (typeof ref === "function") {
            ref(r);
          } else if (ref && typeof ref === "object") {
            ref.current = r;
          }
        });
      }}
      isEditingMode={isEditingMode}
      handleSlidePress={handleSlidePress}
      onKeyPress={onKeyPress}
      setData={setData}
      columnData={item}
    />
  );

  // Handle Showing Last Empty Slide
  if (currSlideIdx == data.viewObject?.slides.length) {
    return (
      <Pressable
        onPress={handleSlidePress}
        className={`cursor-default flex justify-center items-center w-full h-full p-2 bg-${presentationSettings.backgroundColor}`}
      >
        <View className="w-52 h-60 bg-sky-50 rounded-3xl justify-center items-center">
          <Image
            source={require("../../public/logo512.png")}
            className="w-40 h-40 drop-shadow-[0_5.0px_4.0px_rgba(0,0,0.8,0.8)] hover:drop-shadow-[0_8.0px_8.0px_rgba(0,0,0.8,0.8)] hover:-translate-y-2 duration-500"
          />
        </View>
      </Pressable>
    );
  }

  const toggleSettingsicons = () => setIsPresentationSettingsIconShown(true);
  return (
    <View
      className={`flex w-full h-full p-2 bg-${presentationSettings.backgroundColor}`}
      onPointerMove={toggleSettingsicons}
    >
      {/* Settings Menu */}
      <View className="absolute top-4 left-4 z-10 w-auto">
        <ToolBox
          showOnlyIf={isPresentationSettingsIconShown}
          actions={[
            {
              key: "settings",
              iconName: "settings",
              onPress: () => setIsSettingsMenuOpen(!isSettingsMenuOpen),
              iconClassName: `text-${presentationSettings.fontColor}`,
            },
          ]}
        />
        {isSettingsMenuOpen && (
          <View
            onStartShouldSetResponder={() => true}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <SlideSettingsMenu />
          </View>
        )}
      </View>

      {/* Action Buttons - View Mode */}
      <ToolBox
        className="absolute top-4 z-10 right-4 w-[10%] h-[6%] flex flex-row justify-end items-center rounded-md"
        showOnlyIf={isPresentationSettingsIconShown && !isEditingMode}
        actions={[
          {
            key: "info",
            iconName: "info",
            onPress: () => {
              exitFullScreen();
              router.navigate(`/hymn/${uuid}`);
            },
            iconClassName: `text-${presentationSettings.fontColor}`,
          },
          {
            key: "share",
            iconName: "share-2",
            onPress: handleShare,
            iconClassName: `text-${presentationSettings.fontColor}`,
          },
          {
            key: "edit",
            iconName: "edit",
            onPress: handleOnEdit,
            iconClassName: `text-${presentationSettings.fontColor}`,
          },
        ]}
      />

      {/* Action Buttons - Edit Mode */}
      <ToolBox
        className="absolute m-auto left-0 top-4 z-10 right-0 bg-gray-600 w-[10%] h-[6%] flex flex-row justify-center items-center rounded-md"
        showOnlyIf={isPresentationSettingsIconShown && isEditingMode}
        onConfirmModalVisibleChange={setEditToolboxModalOpen}
        actions={[
          {
            key: "delete",
            iconName: "trash",
            iconClassName: "text-red-500 hover:text-red-600 duration-100",
            confirm: true,
            onPress: deleteSlide,
          },
          {
            key: "cancel",
            iconName: "x",
            iconClassName: "text-red-400 hover:text-red-500 duration-100",
            onPress: cancelEditing,
          },
          {
            key: "submit",
            iconName: "check",
            iconClassName: "text-green-400 hover:text-green-500 duration-100",
            confirm: true,
            onPress: submitEdit,
          },
        ]}
      />

      {/* Add Slide Buttons */}
      <PlusButton
        className="absolute right-8 ml-auto top-1/2 hover:scale-125 ease-in-out duration-200 z-10 animate-pulse"
        showOnlyIf={isPresentationSettingsIconShown && isEditingMode}
        onPressCallback={() => addSlideAt("next")}
      />
      <PlusButton
        className="absolute left-8 ml-auto top-1/2 hover:scale-125 ease-in-out duration-200 z-10 animate-pulse"
        showOnlyIf={isPresentationSettingsIconShown && isEditingMode}
        onPressCallback={() => addSlideAt("prev")}
      />

      {/* Main Content Area */}
      <View className="gap-2 w-[80%] h-full self-center">
        <FlatList
          className="w-full justify-center"
          horizontal
          data={data.viewObject?.slides[currSlideIdx]?.columns}
          renderItem={renderItem}
        />
      </View>

      {/* Slide Counter */}
      <HymnosText
        className={`absolute text-${presentationSettings.fontColor} bottom-0 text-xl m-2`}
      >
        {currSlideIdx + 1} | {data.viewObject?.slides.length}
      </HymnosText>
    </View>
  );
}
