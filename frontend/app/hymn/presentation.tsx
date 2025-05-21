import PlusButton from "@components/base/PlusButton";
import ToolBox from "@components/base/ToolBox";
import { get_slides_of_hymn, update_hymn_with_slides } from "@db/dexie";
import { Slide } from "@db/models";
import * as Crypto from "expo-crypto";
import { useKeyEvent } from "expo-key-event";
import { router, useLocalSearchParams } from "expo-router";
import _ from "lodash";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, TextInput, View } from "react-native";
import useHymnosState from "../../global";
// import Toolbox from "@components/Toolbox";
import HymnosText from "@components/base/HymnosText";
import Loader from "@components/base/Loader";
import SlideSettingsMenu from "@components/menus/SlideSettingsMenu";
import { addLastViewedHymn } from "@db/localstorage";
import { usePresentationFonts } from "@hooks/usePresentationFonts";
import * as ScreenOrientation from "expo-screen-orientation";

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

  // inspired from: https://medium.com/@oherterich/creating-a-textarea-with-dynamic-height-using-react-and-typescript-5ed2d78d9848
  // re-called if node ref is updated, current text value changed (slide idx changed), or font is changed
  const textAreaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      if (node != null) {
        // We need to reset the height momentarily to get the correct scrollHeight for the textarea
        node.style.height = "0px";
        const scrollHeight = node.scrollHeight;
        // We then set the height directly, outside of the render loop
        // Trying to set this with state or a ref will product an incorrect value.
        node.style.height = scrollHeight + "px";
      }
    },
    [slides, presentationSettings, currSlideIdx],
  );

  const focusRef = useRef(null);

  const focusTextAreaAndMoveCaretToEnd = () => {
    const input: HTMLTextAreaElement = focusRef.current;
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
      const newKey =
        ke.key === "ArrowRight"
          ? (prevIdx + 1) % slides.length
          : ke.key === "ArrowLeft"
            ? (prevIdx + slides.length - 1) % slides.length
            : prevIdx;

      // setCurrentTextAreaValue(slides[newKey].lines.join("\n"))
      return newKey; // Return previous index if key is not handled
    });
  };

  // Handling key events
  // re-runs on keyEvent change
  useEffect(() => {
    if (!slides || slides.length === 0 || !keyEvent) return; // Handle edge case
    handleKeyEvent(keyEvent);
  }, [keyEvent]);

  // Fetch hymn from db using uuid once
  useEffect(() => {
    get_slides_of_hymn(uuid)
      .then((s) => {
        if (isNew !== undefined && s.length == 0) {
          const emptySlides: Slide[] = [
            { uuid: Crypto.randomUUID(), lines: [], hymn_uuid: uuid },
          ];
          setSlides(emptySlides);
          setbackupSlides(_.cloneDeep(emptySlides));
          setIsEditingMode(true);
        } else {
          setSlides(s);
          setbackupSlides(_.cloneDeep(s));
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
    if (isPresentationSettingsIconShown && !isSettingsMenuOpen) {
      const timer = setTimeout(
        () => setIsPresentationSettingsIconShown(false),
        3000,
      );
      return () => clearTimeout(timer);
    }
  }, [isPresentationSettingsIconShown, isSettingsMenuOpen]);

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

  const addEmptyNextSlide = () => {
    const emptySlide: Slide = {
      uuid: Crypto.randomUUID(),
      hymn_uuid: uuid,
      lines: [],
    };
    setSlides((prevSlides) => [
      ...prevSlides.slice(0, currSlideIdx + 1),
      emptySlide,
      ...prevSlides.slice(currSlideIdx + 1),
    ]);
    setCurrSlideIdx(currSlideIdx + 1);
    focusTextAreaAndMoveCaretToEnd();
  };
  const addEmptyPreviousSlide = () => {
    const emptySlide: Slide = {
      uuid: Crypto.randomUUID(),
      hymn_uuid: uuid,
      lines: [],
    };
    setSlides((prevSlides) => [
      ...prevSlides.slice(0, currSlideIdx),
      emptySlide,
      ...prevSlides.slice(currSlideIdx),
    ]);
    focusTextAreaAndMoveCaretToEnd();
  };

  function handleShare(): void {
    throw new Error("Function not implemented.");
  }

  function handleOnEdit(): void {
    setIsEditingMode(true);
    focusTextAreaAndMoveCaretToEnd();
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
        onPressCallback={addEmptyNextSlide}
      />
      <PlusButton
        className="absolute left-8 ml-auto top-1/2 hover:scale-125 ease-in-out duration-200 z-10 animate-pulse"
        showOnlyIf={isPresentationSettingsIconShown && isEditingMode}
        onPressCallback={addEmptyPreviousSlide}
      />

      {/* Hymn Text Display */}
      <Pressable
        className="flex-1 justify-center items-center cursor-default"
        onPress={(e) => {
          setIsPresentationSettingsIconShown(true);
          setIsSettingsMenuOpen(false);

          const screenWidth = Dimensions.get("screen").width;
          console.log(e.nativeEvent.pageX, e.nativeEvent.pageY, screenWidth);
          // For mobile when user clicks on left and right side of the slides
          if (e.nativeEvent.pageX / screenWidth <= 0.25) {
            setCurrSlideIdx((currSlideIdx + slides.length - 1) % slides.length);
          } else if (e.nativeEvent.pageX / screenWidth >= 0.75) {
            setCurrSlideIdx((currSlideIdx + 1) % slides.length);
          }
        }}
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
            ref={(el) => {
              // @ts-ignore
              textAreaRef(el);
              focusRef.current = el;
            }}
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
