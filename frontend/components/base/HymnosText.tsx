import React from "react"
import { Text, TextProps, View } from "react-native"
import { getFontFamilyFromClassName, useRubikFonts } from "@hooks/useRubikFonts";


interface HymnosTextProps extends TextProps {
  children: React.ReactNode;
}

export default function HymnosText({ children, style, className, ...rest }: HymnosTextProps) {
  const fontsLoaded = useRubikFonts();
  if (!fontsLoaded) return null;

  return (
    <Text
      {...rest}
      style={[{ fontFamily: getFontFamilyFromClassName(className) }, style]}
      className={className}
    >
      {children}
    </Text>
  );
}