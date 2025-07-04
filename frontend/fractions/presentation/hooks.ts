// hooks/useHymnData.ts
import { get_hymn_using_id } from "@db/crud/read";
import { useEffect, useState } from "react";
// import { Slide } from "@db/legacy_models";
import { shareText } from "@utils/sharing";
import { useKeyEvent } from "expo-key-event";
import { router } from "expo-router";
import _ from "lodash";
import { useRef } from "react";
import { Dimensions, GestureResponderEvent } from "react-native";
import useHymnosState from "../../global";
// import { update_hymn_with_slides } from "@db/crud/update";
// import { emitInfo } from "@utils/notification";
import { components as OPENAPI } from "@db/models";
import { PGlite } from "@electric-sql/pglite/dist/index.cjs";
import { createEmptySlide } from "@fractions/presentation/handlers";
import { AbstractData } from "@fractions/presentation/types";
import { upsert_hymn_safe } from "@db/crud/update";
import { emitInfo } from "@utils/notification";

type HymnView = OPENAPI["schemas"]["HymnView"];
type SlideView = OPENAPI["schemas"]["SlideView"];

export const useData = (db: PGlite, uuid: string, startSlide: string) => {
  const [data, setData] = useState<AbstractData>({
    viewObject: null,
    viewObjectBackup: null,
  });
  const [currSlideIdx, setCurrSlideIdx] = useState<number>(0);

  const lastViewedHymnsUuids = useHymnosState.getState().lastViewedHymns;
  const setLastViewedHymnsUuids = useHymnosState.getState().setLastViewedHymns;

  const updateData = (data: HymnView) => {
    setData({ viewObject: data, viewObjectBackup: _.cloneDeep(data) });
  };

  useEffect(() => {
    get_hymn_using_id(db, uuid)
      .then((hymn) => {
        if (hymn.slides.length == 0) {
          const dataWithSlides = { ...hymn };
          dataWithSlides.slides.push(createEmptySlide());
          updateData(dataWithSlides);
        } else {
          updateData(hymn);
          const idxFound = hymn.slides.findIndex(
            (item) => item.slide_id == startSlide,
          );
          if (idxFound != -1) {
            setCurrSlideIdx(idxFound);
          }
        }
        const currentLastViewed = [...lastViewedHymnsUuids, uuid];
        setLastViewedHymnsUuids(
          _.takeRight([...new Set(currentLastViewed)], 10),
        );
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
  textAreaRef: any,
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
        ke.key === "ArrowRight"
          ? (prevIdx + 1) % slidesWithEndLength
          : ke.key === "ArrowLeft"
            ? (prevIdx + slidesWithEndLength - 1) % slidesWithEndLength
            : prevIdx;
      return newKey;
    });
  };

  const handleSlidePress = (e: GestureResponderEvent) => {
    setIsPresentationSettingsIconShown(true);
    setIsSettingsMenuOpen(false);
    if (isEditingMode && document.activeElement == textAreaRef.current) {
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
  const textAreaRef = useRef(null);

  const focusTextAreaAndMoveCaretToEnd = () => {
    const input: HTMLTextAreaElement = textAreaRef.current;
    if (input) {
      input.focus();
      const length = input.value.length;
      input.setSelectionRange(length, length);
    }
  };

  const handleOnEdit = () => {
    setIsEditingMode(true);
    focusTextAreaAndMoveCaretToEnd();
  };

  const cancelEditing = () => {
    setData({ ...data, viewObject: _.cloneDeep(data.viewObjectBackup) });
    setIsEditingMode(false);
  };

  const submitEdit = () => {
    upsert_hymn_safe(db, data.viewObject).then((updatedHymn) => {
      setData({
        viewObject: updatedHymn,
        viewObjectBackup: _.cloneDeep(updatedHymn),
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
    textAreaRef,
    handleOnEdit,
    cancelEditing,
    submitEdit,
    deleteSlide,
    focusTextAreaAndMoveCaretToEnd,
  };
};

export const useSlideActions = (
  data: any,
  currSlideIdx: number,
  setData: React.Dispatch<React.SetStateAction<AbstractData>>,
  setCurrSlideIdx: any,
  focusTextAreaAndMoveCaretToEnd: () => void,
) => {
  const handleShare = () => {
    const currSlide = data.slides[currSlideIdx];
    shareText(currSlide.lines.join("\n"), window.location.href);
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
    focusTextAreaAndMoveCaretToEnd();
  };

  return { handleShare, addSlideAt };
};

export const useUIState = () => {
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isPresentationSettingsIconShown, setIsPresentationSettingsIconShown] =
    useState(false);
  const [isEditToolboxModalOpen, setEditToolboxModalOpen] = useState(false);

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
