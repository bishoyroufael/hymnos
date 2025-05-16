import { Rubik_400Regular, Rubik_300Light, Rubik_600SemiBold, Rubik_700Bold, Rubik_500Medium } from "@expo-google-fonts/rubik";
import { useFonts } from "expo-font";
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from "react"
import { Text, TextProps, View } from "react-native"
import { fontWeightMap } from "./shared/typography";


interface HymnosTextProps extends TextProps {
  children: React.ReactNode;
}



export default function HymnosText({ children, style, className, ...rest }: HymnosTextProps) {
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
    <Text
      {...rest}
      style={[{ fontFamily: fontWeightMap[fontKey] }]}
      className={className}
    >
      {children}
    </Text>
  );
}