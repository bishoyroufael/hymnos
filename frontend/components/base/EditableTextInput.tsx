import { getFontFamilyFromClassName } from "@hooks/useHymnosFonts";
import React, { useCallback } from "react";
import { TextInput, TextInputProps } from "react-native";

type EditableTextInputProps = TextInputProps & {
  placeholder: string;
  isEditing: boolean;
  value: string;
  valueIfEmpty?: string;
  rtl?: boolean;
  className?: string;
  refKey?: string;
  sizeChangeDeps?: any[];
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
  sizeChangeDeps = [],
  ...rest
}: EditableTextInputProps) => {
  const multilineCenterRef =
    // Dynamically change textAreaHeight if deps changed
    // i.e happens if presentation settings changed
    useCallback((node) => {
      if (node && rest.multiline) {
        node.style.height = "0px";
        const scrollHeight = node.scrollHeight;
        node.style.height = scrollHeight + "px";
      }
    }, sizeChangeDeps);

  return (
    <TextInput
      ref={multilineCenterRef}
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
      // numberOfLines={value.split("\n").length}
      value={!isEditing && !value && valueIfEmpty ? valueIfEmpty : value}
      onChangeText={(updatedText) => {
        onUpdateText(refKey, updatedText);
      }}
      {...rest}
    />
  );
};

export default EditableTextInput;
