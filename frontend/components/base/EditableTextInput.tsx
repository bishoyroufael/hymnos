import {
  getFontFamilyFromClassName,
  useRubikFonts,
} from "@hooks/useRubikFonts";
import React, { forwardRef } from "react";
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

const EditableTextInput = forwardRef<TextInput, EditableTextInputProps>(
  (
    {
      className,
      rtl,
      refKey,
      placeholder,
      isEditing,
      value,
      valueIfEmpty,
      onUpdateText,
      ...rest
    },
    ref,
  ) => {
    // const fontsLoaded = useRubikFonts();
    // if (!fontsLoaded) return null;

    return (
      <TextInput
        ref={ref}
        style={{
          direction: rtl ? "rtl" : "ltr",
          fontFamily: getFontFamilyFromClassName(className),
        }}
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
  },
);

export default EditableTextInput;
