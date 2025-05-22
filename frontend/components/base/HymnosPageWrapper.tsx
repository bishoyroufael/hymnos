import Footer from "@components/base/Footer";
import Header from "@components/base/Header";
import HymnosText from "@components/base/HymnosText";
import React from "react";
import { ScrollView, View } from "react-native";
import { ToastContainer } from "react-toastify";

interface HymnosPageWrapperProps {
  onUploadDataCallback?: () => void;
  children: React.ReactNode;
}

// wrapper that is shared to style all pages in the app
export default function HymnosPageWrapper({
  onUploadDataCallback,
  children,
}: HymnosPageWrapperProps) {
  return (
    <View className="flex h-full w-full justify-between">
      <ToastContainer />
      <ScrollView contentContainerClassName="justify-between h-full w-full flex">
        <Header onUploadDataCallback={onUploadDataCallback} />
        <View className="flex gap-y-4 p-4 self-center justify-start w-10/12 flex-grow">
          {children}
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
}
