import {
  getFontFamilyFromClassName,
  useRubikFonts,
} from "@hooks/useRubikFonts";
import React from "react";
import { TextInput, TextInputProps } from "react-native";

interface EditableTextInputProps extends TextInputProps {
  refKey: string;
  placeholder: string;
  isEditing: boolean;
  value: string;
  valueIfEmpty?: string;
  rtl?: boolean;
  onUpdateText: (key: string, value: string) => void;
}

export default function EditableTextInput({
  className,
  rtl,
  refKey,
  placeholder,
  isEditing,
  value,
  valueIfEmpty,
  onUpdateText,
  ...rest
}: EditableTextInputProps) {
  const fontsLoaded = useRubikFonts();
  if (!fontsLoaded) return null;

  return (
    <TextInput
      style={{
        direction: rtl ? "rtl" : "ltr",
        fontFamily: getFontFamilyFromClassName(className),
      }} // should be switched when there's multiple languages
      className={className}
      placeholderTextColor={"#aaaaaa"}
      placeholder={placeholder}
      caretHidden={!isEditing}
      readOnly={!isEditing}
      value={!isEditing && !value && valueIfEmpty ? valueIfEmpty : value}
      onChangeText={(updatedText) => onUpdateText(refKey, updatedText)}
      {...rest}
    />
  );
}
