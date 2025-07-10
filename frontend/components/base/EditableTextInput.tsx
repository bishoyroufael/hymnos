import { getFontFamilyFromClassName } from "@hooks/useRubikFonts";
import React, { useState } from "react";
import { TextInput, TextInputProps } from "react-native";

type EditableTextInputProps = TextInputProps & {
  placeholder: string;
  isEditing: boolean;
  value: string;
  valueIfEmpty?: string;
  rtl?: boolean;
  className?: string;
  refKey?: string;
  onUpdateText: (key: string, value: string) => void;
};

const EditableTextInput = ({
  className,
  rtl,
  refKey,
  placeholder,
  isEditing,
  value,
  valueIfEmpty,
  onUpdateText,
  style,
  ...rest
}: EditableTextInputProps) => {
  return (
    <TextInput
      style={[
        {
          direction: rtl ? "rtl" : "ltr",
          fontFamily: getFontFamilyFromClassName(className),
        },
        style,
      ]}
      className={className}
      placeholderTextColor={"#aaaaaa"}
      placeholder={placeholder}
      caretHidden={!isEditing}
      readOnly={!isEditing}
      numberOfLines={value.split("\n").length}
      value={!isEditing && !value && valueIfEmpty ? valueIfEmpty : value}
      onChangeText={(updatedText) => {
        onUpdateText(refKey, updatedText);
      }}
      {...rest}
    />
  );
};

export default EditableTextInput;
