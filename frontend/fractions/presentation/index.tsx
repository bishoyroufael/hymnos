import EditableTextInput from "@components/base/EditableTextInput";
import { components as OPENAPI } from "@db/models";
import { AbstractData } from "@fractions/presentation/types";
import { PresentationSettings } from "global.interfaces";
import React, { useEffect, useState } from "react";
import {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  View,
} from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import useOrientation from "@hooks/useOrientation";

type SlideColumnView = OPENAPI["schemas"]["SlideColumnView"];

interface SlideColumnProps {
  id: string;
  isEditingMode: boolean;
  onKeyPress: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  setData: React.Dispatch<React.SetStateAction<AbstractData>>;
  columnData: SlideColumnView;
  presentationSettings: PresentationSettings;
}

const SlideColumn = ({
  id,
  isEditingMode,
  onKeyPress,
  setData,
  columnData,
  presentationSettings,
}: SlideColumnProps) => {
  const { orientation } = useOrientation();

  const onChangeTextContent = (_key: string, updatedLineText: string) => {
    // we need to keep track of columns
    setData((prev) => ({
      ...prev,
      viewObject: {
        ...prev.viewObject,
        slides: prev.viewObject.slides.map((slide) => ({
          ...slide,
          columns: slide.columns.map((c) =>
            c === columnData ? { ...c, [_key]: updatedLineText } : c,
          ),
        })),
      },
    }));
  };

  return (
    <View className="flex-1 justify-center items-center cursor-default" id={id}>
      {(isEditingMode || columnData.header) && (
        <EditableTextInput
          id={`header-${id}`}
          className={`w-full text-center opacity-70 text-${presentationSettings.fontColor} outline-none resize-none ${isEditingMode ? `animate-pulse focus:outline-${presentationSettings.fontColor}` : ""} rounded-lg scrollbar-hide`}
          placeholder="اكتب عنوان.."
          style={{
            fontFamily: presentationSettings.font,
            fontSize: presentationSettings.fontSize / 2,
          }}
          value={columnData.header}
          isEditing={isEditingMode}
          refKey={"header"}
          onUpdateText={onChangeTextContent}
        />
      )}

      <EditableTextInput
        id={`column-${id}`}
        placeholderTextColor="#aaaaaa"
        placeholder={"اكتب كلام الترنيمه..."}
        multiline={true}
        onKeyPress={onKeyPress}
        className={`w-full text-center text-${presentationSettings.fontColor} outline-none resize-none ${isEditingMode ? `animate-pulse focus:outline-${presentationSettings.fontColor}` : ""} rounded-lg scrollbar-hide`}
        style={{
          fontFamily: presentationSettings.font,
          fontSize: presentationSettings.fontSize,
          lineHeight: presentationSettings.fontSize * 2,
        }}
        value={columnData.content}
        refKey={"content"}
        isEditing={isEditingMode}
        onUpdateText={onChangeTextContent}
        sizeChangeDeps={[presentationSettings, columnData.content, orientation]}
      />
    </View>
  );
};

export default SlideColumn;
