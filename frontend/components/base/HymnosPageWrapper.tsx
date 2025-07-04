import Footer from "@components/base/Footer";
import Header from "@components/base/Header";
import HymnosText from "@components/base/HymnosText";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View, Text } from "react-native";
import { ToastContainer } from "react-toastify";

// wrapper that is shared to style all pages in the app
export default function HymnosPageWrapper({ children }) {
  return (
    <View className="flex h-full w-full justify-between">
      <ScrollView contentContainerClassName="justify-between h-full w-full flex">
        <Header />
        <View className="flex gap-y-4 p-4 self-center justify-start w-10/12 flex-grow">
          {children}
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
}
