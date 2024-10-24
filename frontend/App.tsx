import "@expo/metro-runtime";
import "./global.css";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import HomePage from './pages/Home';
import HymnPack from "./pages/HymnPack";
import HymnPresentation from "./pages/HymnPresentation";

export default function App() {
  return (
    <View className="flex justify-center items-center h-full w-full">
        {/* <HomePage /> */}
        {/* <HymnPack/> */}
        <HymnPresentation/>
      <StatusBar style="auto" />
    </View>
  );
}

