import React from "react";
import { View } from "react-native";
import { Image, ImageProps } from "expo-image";

interface LogoProps {
  isPulsing?: boolean;
}

export default function Logo({ isPulsing = false }: LogoProps) {
  return (
    <Image
      source={require("../../public/logo512.png")}
      className={`w-48 h-48 drop-shadow-[0_5.0px_4.0px_rgba(0,0,0.8,0.8)] hover:drop-shadow-[0_8.0px_8.0px_rgba(0,0,0.8,0.8)] hover:-translate-y-2 duration-500 ${isPulsing ? "animate-pulse" : ""}`}
    />
  );
}
