import PlusButton from "@components/base/PlusButton";
import ToolBox from "@components/base/ToolBox";
import { get_slides_of_hymn, update_hymn_with_slides } from "@db/dexie";
import { Slide } from "@db/models";
import * as Crypto from "expo-crypto";
import { useKeyEvent } from "expo-key-event";
import { router, useLocalSearchParams } from "expo-router";
import _ from "lodash";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  GestureResponderEvent,
  Pressable,
  TextInput,
  View,
} from "react-native";
import useHymnosState from "../../global";
import HymnosText from "@components/base/HymnosText";
import Loader from "@components/base/Loader";
import SlideSettingsMenu from "@components/menus/SlideSettingsMenu";
import { addLastViewedHymn } from "@db/localstorage";
import { usePresentationFonts } from "@hooks/usePresentationFonts";
import { shareText } from "@utils/sharing";
import { Image } from "expo-image";
import useAutoSizeTextArea from "@hooks/useAutoSizeTextArea";

export default function HymnPresentation() {
  const { uuid, isNew, startSlide } = useLocalSearchParams<{
    uuid: string;
    isNew: string;
    startSlide: string;
  }>();

  if (uuid == null) {
    router.navigate("/notfound");
    return null;
  }

  const { presentationSettings } = useHymnosState();
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isPresentationSettingsIconShown, setIsPresentationSettingsIconShown] =
    useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currSlideIdx, setCurrSlideIdx] = useState<number>(0);
  const [backupSlides, setbackupSlides] = useState<Slide[]>([]); // will be used with editing toolbox
  const { keyEvent } = useKeyEvent();

  const textAreaRef = useRef(null);

  const focusTextAreaAndMoveCaretToEnd = () => {
    const input: HTMLTextAreaElement = textAreaRef.current;
    if (input) {
      input.focus();
      const length = input.value.length;
      input.setSelectionRange(length, length); // Move caret to end
    }
  };

  const handleKeyEvent = (ke: any) => {
    if (ke && ke.key === "Escape") {
      router.canGoBack() ? router.back() : router.navigate("/");
    }
    setCurrSlideIdx((prevIdx) => {
      const slidesWithEndLength = slides.length + 1;
      const newKey =
        ke.key === "ArrowRight"
          ? (prevIdx + 1) % slidesWithEndLength
          : ke.key === "ArrowLeft"
            ? (prevIdx + slidesWithEndLength - 1) % slidesWithEndLength
            : prevIdx;

      return newKey; // Return previous index if key is not handled
    });
  };

  const handleSlidePress = (e: GestureResponderEvent) => {
    setIsPresentationSettingsIconShown(true);
    setIsSettingsMenuOpen(false);

    setCurrSlideIdx((prevIdx) => {
      const screenWidth = Dimensions.get("screen").width;
      const slidesWithEndLength = slides.length + 1;
      const newKey =
        e.nativeEvent.pageX / screenWidth >= 0.75
          ? (prevIdx + 1) % slidesWithEndLength
          : e.nativeEvent.pageX / screenWidth <= 0.25
            ? (prevIdx + slidesWithEndLength - 1) % slidesWithEndLength
            : prevIdx;

      return newKey;
    });
  };

  // Handling key events
  // re-runs on keyEvent change
  useEffect(() => {
    // console.log("useEffect of KeyEvent!");
    if (!slides || slides.length === 0 || !keyEvent) return; // Handle edge case
    handleKeyEvent(keyEvent);
  }, [keyEvent]);

  const updateSlides = (s: Slide[]) => {
    setSlides(s);
    setbackupSlides(_.cloneDeep(s));
  };

  // Fetch hymn from db using uuid once
  useEffect(() => {
    // console.log("useEffect of fetching data!");
    get_slides_of_hymn(uuid)
      .then((s) => {
        if (isNew !== undefined && s.length == 0) {
          const emptySlides: Slide[] = [createEmptySlide()];
          updateSlides(emptySlides);
          setIsEditingMode(true);
        } else {
          updateSlides(s);
          const idxFound = s.findIndex((item) => item.uuid == startSlide);
          if (idxFound != -1) {
            setCurrSlideIdx(idxFound);
          }
        }
        addLastViewedHymn(uuid);
      })
      .catch((e) => {
        console.log(e);
        router.navigate("/notfound");
      });
  }, []);

  // Auto-hide the menu after a few seconds
  useEffect(() => {
    // console.log("useEffect of autohiding presentation icons!");
    if (isPresentationSettingsIconShown && !isSettingsMenuOpen) {
      const timer = setTimeout(
        () => setIsPresentationSettingsIconShown(false),
        3000,
      );
      return () => clearTimeout(timer);
    }
  }, [isPresentationSettingsIconShown, isSettingsMenuOpen]);

  useAutoSizeTextArea(
    "presentation-text-area",
    textAreaRef.current,
    slides,
    presentationSettings,
    currSlideIdx,
  );

  // Font loading
  const fontsLoaded = usePresentationFonts();
  if (!fontsLoaded) return null;

  const cancelEditing = () => {
    setSlides(_.cloneDeep(backupSlides));
    setIsEditingMode(false);
  };

  const deleteSlide = () => {
    if (slides.length == 1) {
      // one slide available, deletion should be prevented
      return;
    }
    setSlides((prevSlides) => {
      setCurrSlideIdx(
        currSlideIdx == slides.length - 1
          ? currSlideIdx - 1
          : currSlideIdx % (slides.length - 1),
      );
      return prevSlides.filter((_, index) => index !== currSlideIdx);
    });
  };

  const submitEdit = () => {
    update_hymn_with_slides(uuid, slides);
    setIsEditingMode(false);
  };

  const createEmptySlide = (): Slide => ({
    uuid: Crypto.randomUUID(),
    hymn_uuid: uuid,
    lines: [],
  });

  const addSlideAt = (position: "next" | "prev") => {
    const newSlide = createEmptySlide();
    setSlides((prev) => {
      const idx = position === "next" ? currSlideIdx + 1 : currSlideIdx;
      return [...prev.slice(0, idx), newSlide, ...prev.slice(idx)];
    });
    if (position === "next") setCurrSlideIdx((i) => i + 1);
    focusTextAreaAndMoveCaretToEnd();
  };

  function handleShare(): void {
    const currSlide = slides[currSlideIdx];
    shareText(currSlide.lines.join("\n"), window.location.href);
  }

  function handleOnEdit(): void {
    setIsEditingMode(true);
    focusTextAreaAndMoveCaretToEnd();
  }

  // Handle Showing Last Empty Slide
  if (currSlideIdx == slides.length) {
    return (
      // Pressable needed on mobile devices to re-trigger handleSlidePress
      // which allows user to re-visit the previous slides
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

  return (
    <View
      className={`flex w-full h-full p-2 bg-${presentationSettings.backgroundColor}`}
      onPointerMove={() => setIsPresentationSettingsIconShown(true)}
    >
      {/* Icons/Tools */}
      <View className="absolute top-4 left-4 z-10 w-auto">
        <ToolBox
          showOnlyIf={isPresentationSettingsIconShown}
          actions={[
            {
              key: "settings",
              iconName: "settings",
              onPress: () => {
                setIsSettingsMenuOpen(!isSettingsMenuOpen);
              },
              iconClassName: `text-${presentationSettings.fontColor}`,
            },
          ]}
        />
        {isSettingsMenuOpen && (
          <View
            onStartShouldSetResponder={() => true} // Capture touch events for menu
            onTouchStart={(e) => {
              e.stopPropagation(); // Stop propagation to avoid closing
              e.preventDefault(); // Prevent closing the menu when interacting
            }}
          >
            <SlideSettingsMenu />
          </View>
        )}
      </View>
      <ToolBox
        className="absolute top-4 z-10 right-4 w-[10%] h-[6%] flex flex-row justify-end items-center rounded-md"
        showOnlyIf={isPresentationSettingsIconShown && !isEditingMode}
        actions={[
          {
            key: "info",
            iconName: "info",
            onPress: () => {
              router.navigate(`/hymn/details?uuid=${uuid}`);
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
      <ToolBox
        className="absolute m-auto left-0 top-4 z-10 right-0 bg-gray-600 w-[10%] h-[6%] flex flex-row justify-center items-center rounded-md"
        showOnlyIf={isPresentationSettingsIconShown && isEditingMode}
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
      {/* Hymn Text Display */}
      <Pressable
        className="flex-1 justify-center items-center cursor-default"
        onPress={handleSlidePress}
      >
        {slides && slides.length > 0 && slides[currSlideIdx] ? (
          <TextInput
            placeholderTextColor="#aaaaaa"
            placeholder="اكتب كلام الترنيمه..."
            readOnly={!isEditingMode}
            caretHidden={!isEditingMode}
            multiline={true}
            onKeyPress={(e) => {
              if (isEditingMode) return;
              handleKeyEvent(e.nativeEvent);
            }}
            id="presentation-text-area"
            ref={textAreaRef}
            onChangeText={(updatedLineText) => {
              const updatedSlide = slides[currSlideIdx];
              updatedSlide.lines = updatedLineText.split("\n");
              setSlides(slides.with(currSlideIdx, updatedSlide));
            }}
            className={`no-scrollbar text-center text-${presentationSettings.fontColor} outline-none w-[80%] resize-none ${isEditingMode ? `animate-pulse focus:outline-${presentationSettings.fontColor}` : ""} rounded-lg`}
            style={{
              fontFamily: presentationSettings.font,
              fontSize: presentationSettings.fontSize,
            }}
            value={slides[currSlideIdx].lines.join("\n")}
          />
        ) : (
          <Loader />
        )}
      </Pressable>
      <HymnosText
        className={`absolute text-${presentationSettings.fontColor} bottom-0 text-xl m-2`}
      >
        {currSlideIdx + 1} | {slides.length}
      </HymnosText>
    </View>
  );
}
