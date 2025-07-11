import { getFontFamilyFromClassName } from "@hooks/useHymnosFonts";
import React from "react";
import { Text, TextProps } from "react-native";

interface HymnosTextProps extends TextProps {
  children: React.ReactNode;
}

export default function HymnosText({
  children,
  style,
  className,
  ...rest
}: HymnosTextProps) {
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
