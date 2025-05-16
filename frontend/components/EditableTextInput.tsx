import { Rubik_300Light, Rubik_400Regular, Rubik_500Medium, Rubik_600SemiBold, Rubik_700Bold } from "@expo-google-fonts/rubik";
import { useFonts } from "expo-font";
import React, { useEffect } from "react"
import { TextInput, TextInputProps, View } from "react-native"
import * as SplashScreen from 'expo-splash-screen';
import { fontWeightMap } from "./shared/typography";

interface EditableTextInputProps extends TextInputProps {
    refKey: string,
    placeholder: string,
    isEditing: boolean,
    value: string,
    valueIfEmpty?: string,
    rtl?: boolean,
    onUpdateText: (key: string, value: string) => void;
}


export default function EditableTextInput ({className, rtl, refKey, placeholder, isEditing, value, valueIfEmpty, onUpdateText, ...rest}: EditableTextInputProps) {
  const [fontsLoaded] = useFonts({
    Rubik_300Light,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;
  
  const fontKey = Object.keys(fontWeightMap).find((v)=> className && className.includes(v)) || "font-regular"
  
  return (
    <TextInput
        style={{ direction: rtl ? "rtl" : "ltr", fontFamily: fontWeightMap[fontKey] }} // should be switched when there's multiple languages
        className={className}
        placeholderTextColor={"#aaaaaa"}
        placeholder={placeholder}
        caretHidden={!isEditing}
        readOnly={!isEditing}
        value={!isEditing && !value && valueIfEmpty ? valueIfEmpty : value}
        onChangeText={(updatedText) => onUpdateText(refKey, updatedText)}
        {...rest}
    />
  )
};