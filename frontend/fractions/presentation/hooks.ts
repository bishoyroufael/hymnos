// hooks/useHymnData.ts
import {
  get_bible_chapter,
  get_content_slides,
  get_content_using_id,
  get_hymn_using_id,
} from "@db/crud/read";
import { useEffect, useMemo, useState } from "react";
// import { Slide } from "@db/legacy_models";
import { shareText } from "@utils/sharing";
import { useKeyEvent } from "expo-key-event";
import { router } from "expo-router";
import _ from "lodash";
import { useRef } from "react";
import { Dimensions, GestureResponderEvent } from "react-native";
import useHymnosState from "../../global";
import { ContentType, components as OPENAPI } from "@db/models";
import { PGlite } from "@electric-sql/pglite/dist/index.cjs";
import { createEmptySlide } from "@fractions/presentation/handlers";
import { AbstractData } from "@fractions/presentation/types";
import { upsert_hymn_safe, upsert_slides_safe } from "@db/crud/update";
import { emitInfo } from "@utils/notification";
import * as ScreenOrientation from "expo-screen-orientation";
import { hideAsync } from "expo-splash-screen";

type HymnView = OPENAPI["schemas"]["HymnView"];
type BibleChapterView = OPENAPI["schemas"]["BibleChapterView"];
type SlideView = OPENAPI["schemas"]["SlideView"];
type ContentSlidesView = OPENAPI["schemas"]["ContentSlidesView"];

export const useData = (db: PGlite, uuid: string, startSlide: string) => {
  const [data, setData] = useState<AbstractData>({
    viewObject: null,
    viewObjectBackup: null,
  });

  const [currSlideIdx, setCurrSlideIdx] = useState<number>(0);

  const lastViewedContentsUuids = useHymnosState.getState().lastViewedContent;
  const setLastViewedContent = useHymnosState.getState().setLastViewedContent;

  const updateData = (data: ContentSlidesView) => {
    setData({ viewObject: data, viewObjectBackup: _.cloneDeep(data) });
  };

  useEffect(() => {
    get_content_slides(db, uuid)
      .then((contentSlides) => {
        if (
          contentSlides.content_type != ContentType.bible_chapter &&
          contentSlides.slides.length == 0
        ) {
          const dataWithSlides = { ...contentSlides };
          dataWithSlides.slides.push(createEmptySlide());
          updateData(dataWithSlides);
          return;
        }
        // Update data with fetched slides from db
        updateData(contentSlides);

        // Set start slide
        const idxFound = contentSlides.slides.findIndex(
          (item) => item.slide_id == startSlide,
        );
        if (idxFound != -1) {
          setCurrSlideIdx(idxFound);
        }
        const currentLastViewed = [...lastViewedContentsUuids, uuid];
        setLastViewedContent(_.takeRight([...new Set(currentLastViewed)], 30));
      })
      .catch((e) => {
        console.log(e);
        router.navigate("/notfound");
      });
  }, []);

  return {
    data,
    setData,
    currSlideIdx,
    setCurrSlideIdx,
    updateData,
  };
};

export const useSlideNavigation = (
  data: AbstractData,
  currSlideIdx: number,
  setCurrSlideIdx: (idx: number | ((prev: number) => number)) => void,
  isEditingMode: boolean,
  setIsPresentationSettingsIconShown: any,
  setIsSettingsMenuOpen: any,
) => {
  const { keyEvent } = useKeyEvent();

  const handleKeyEvent = (ke: any) => {
    if (ke && ke.key === "Escape") {
      router.canGoBack() ? router.back() : router.navigate("/");
    }
    setCurrSlideIdx((prevIdx) => {
      const slidesWithEndLength = data.viewObject?.slides.length + 1;
      const newKey =
        ke.key === "ArrowRight" || ke.key === "ArrowDown"
          ? (prevIdx + 1) % slidesWithEndLength
          : ke.key === "ArrowLeft" || ke.key === "ArrowUp"
            ? (prevIdx + slidesWithEndLength - 1) % slidesWithEndLength
            : prevIdx;
      return newKey;
    });
  };

  const handleSlidePress = (e: GestureResponderEvent) => {
    setIsPresentationSettingsIconShown(true);
    setIsSettingsMenuOpen(false);
    if (
      isEditingMode &&
      ["TEXTAREA", "INPUT"].includes(document.activeElement.tagName) // User is focusing on column to edit
    ) {
      return;
    }
    setCurrSlideIdx((prevIdx) => {
      const windowWidth = Dimensions.get("window").width;
      const slidesWithEndLength = data.viewObject?.slides.length + 1;
      const newKey =
        e.nativeEvent.pageX / windowWidth >= 0.75
          ? (prevIdx + 1) % slidesWithEndLength
          : e.nativeEvent.pageX / windowWidth <= 0.25
            ? (prevIdx + slidesWithEndLength - 1) % slidesWithEndLength
            : prevIdx;
      return newKey;
    });
  };

  useEffect(() => {
    if (
      !data.viewObject?.slides ||
      data.viewObject?.slides.length === 0 ||
      !keyEvent
    )
      return;
    handleKeyEvent(keyEvent);
  }, [keyEvent]);

  return { handleSlidePress, handleKeyEvent };
};

export const useEditingMode = (
  db: PGlite,
  data: AbstractData,
  setData: React.Dispatch<React.SetStateAction<AbstractData>>,
  currSlideIdx: number,
  setCurrSlideIdx: any,
) => {
  const [isEditingMode, setIsEditingMode] = useState(false);

  const handleOnEdit = () => {
    setIsEditingMode(true);
  };

  const cancelEditing = () => {
    setData({ ...data, viewObject: _.cloneDeep(data.viewObjectBackup) });
    setIsEditingMode(false);
  };

  const submitEdit = () => {
    // ASSUME WE ARE EDITING A HYMN ONLY
    // TODO: CHANGE WHEN LITURGY IS INTRODUCED
    upsert_slides_safe(db, data.viewObject).then((updatedSlides) => {
      console.log(updatedSlides);
      setData({
        viewObject: updatedSlides,
        viewObjectBackup: _.cloneDeep(updatedSlides),
      });
      setIsEditingMode(false);
      emitInfo("تم تعديل الترنيمه");
    });
  };

  const deleteSlide = () => {
    if (data.viewObject.slides.length == 1) return;

    setData((prev) => {
      setCurrSlideIdx(
        currSlideIdx == data.viewObject.slides.length - 1
          ? currSlideIdx - 1
          : currSlideIdx % (data.viewObject.slides.length - 1),
      );
      return {
        ...data,
        viewObject: {
          ...data.viewObject,
          slides: prev.viewObject.slides.filter(
            (_: any, index: number) => index !== currSlideIdx,
          ),
        },
      };
    });
  };

  return {
    isEditingMode,
    setIsEditingMode,
    handleOnEdit,
    cancelEditing,
    submitEdit,
    deleteSlide,
  };
};

export const useSlideActions = (
  data: AbstractData,
  currSlideIdx: number,
  setData: React.Dispatch<React.SetStateAction<AbstractData>>,
  setCurrSlideIdx: any,
) => {
  const handleShare = () => {
    const currSlide = data.viewObject.slides[currSlideIdx];
    shareText(currSlide.columns[0].content, window.location.href);
  };

  const addSlideAt = (position: "next" | "prev") => {
    const newSlide = createEmptySlide();
    setData((prev) => {
      const idx = position === "next" ? currSlideIdx + 1 : currSlideIdx;
      return {
        ...prev,
        viewObject: {
          ...prev.viewObject,
          slides: [
            ...prev.viewObject.slides.slice(0, idx),
            newSlide,
            ...prev.viewObject.slides.slice(idx),
          ].map((slide, idx) => ({ ...slide, position: idx })),
        },
      };
    });
    if (position === "next") setCurrSlideIdx((i: number) => i + 1);
  };

  return { handleShare, addSlideAt };
};

export const useUIState = () => {
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isPresentationSettingsIconShown, setIsPresentationSettingsIconShown] =
    useState(false);
  const [isEditToolboxModalOpen, setEditToolboxModalOpen] = useState(false);

  // Force Landscape Orientation
  useMemo(() => {
    async function forceLandscapeMode() {
      await ScreenOrientation.lockPlatformAsync({
        screenOrientationLockWeb:
          ScreenOrientation.WebOrientationLock.LANDSCAPE,
      });
    }
    forceLandscapeMode();
  }, []);

  useEffect(() => {
    if (
      isPresentationSettingsIconShown &&
      !isSettingsMenuOpen &&
      !isEditToolboxModalOpen
    ) {
      const timer = setTimeout(
        () => setIsPresentationSettingsIconShown(false),
        3000,
      );
      return () => clearTimeout(timer);
    }
  }, [
    isPresentationSettingsIconShown,
    isSettingsMenuOpen,
    isEditToolboxModalOpen,
  ]);

  return {
    isSettingsMenuOpen,
    setIsSettingsMenuOpen,
    isPresentationSettingsIconShown,
    setIsPresentationSettingsIconShown,
    isEditToolboxModalOpen,
    setEditToolboxModalOpen,
  };
};
