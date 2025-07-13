import Footer from "@components/base/Footer";
import Header from "@components/base/Header";
import React from "react";
import { ScrollView, View } from "react-native";

interface HymnosPageWrapperProps {
  presentationMode?: boolean;
  children: React.ReactNode;
}

// wrapper that is shared to style all pages in the app
export default function HymnosPageWrapper({
  children,
  presentationMode = false,
}: HymnosPageWrapperProps) {
  return (
    <View className="flex h-full w-full justify-between">
      <ScrollView contentContainerClassName="justify-between h-full w-full flex">
        {!presentationMode && <Header />}
        <View
          className={
            !presentationMode
              ? "flex flex-grow gap-y-4 p-4 self-center justify-start w-10/12"
              : "flex flex-grow self-start justify-center w-full h-full"
          }
        >
          {children}
        </View>
        {!presentationMode && <Footer />}
      </ScrollView>
    </View>
  );
}
