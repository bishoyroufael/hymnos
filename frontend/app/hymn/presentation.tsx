import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Dimensions, ScrollView, SafeAreaView } from "react-native";
import PresentationSettingsMenu from "../../components/PresentationSettingsMenu";
import Ionicons from "@expo/vector-icons/Ionicons";
import useHymnosState from "../../global";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { Rubik_400Regular } from "@expo-google-fonts/rubik";
import { BalooBhaijaan2_400Regular } from "@expo-google-fonts/baloo-bhaijaan-2";
import { router, useLocalSearchParams} from "expo-router";
import { get_slides_of_hymn } from "../../db/dexie";
import { Slide } from "../../db/models";
import { useKeyEvent } from "expo-key-event";

const screenWidth = Dimensions.get('screen').width;

export default function HymnPresentation() {
  const { uuid } = useLocalSearchParams<{uuid: string }>();
  if (uuid == null){
    router.navigate("/notfound");
    return null;
  }

  const {
    isSettingsMenuOpen,
    setIsSettingsMenuOpen,
    isPresentationSettingsIconShown,
    setIsPresentationSettingsIconShown,
    presentationSettings,
    setPresentationSettings,
  } = useHymnosState();

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currSlideIdx, setCurrSlideIdx] = useState<number>(0);
  const { keyEvent } = useKeyEvent();


  // Handling key events
  // re-runs on keyEvent change
  useEffect(()=>{
    if (keyEvent && keyEvent.key === "Escape") {
        router.navigate("/");
    }

    setCurrSlideIdx((prevIdx) => {
      if (!slides || slides.length === 0 || !keyEvent) return prevIdx; // Handle edge case

      if (keyEvent.key === "ArrowRight") {
        return (prevIdx + 1) % slides.length;
      } else if (keyEvent.key === "ArrowLeft") {
        return (prevIdx + slides.length - 1) % slides.length;
      } 

      return prevIdx; // Return previous index if key is not handled
    });
  },[keyEvent])



  // Fetch hymn from db using uuid once
  useEffect(()=>{
    console.log("rerendering happens here!");
    get_slides_of_hymn(uuid)
      .then((s) => setSlides(s))
      .catch((e) => {console.log(e); router.navigate("/notfound");});
  },[])

  // Auto-hide the menu after a few seconds
  useEffect(() => {
    if (isPresentationSettingsIconShown && !isSettingsMenuOpen) {
      const timer = setTimeout(
        () => setIsPresentationSettingsIconShown(false),
        3000
      );
      return () => clearTimeout(timer);
    }
  }, [isPresentationSettingsIconShown, isSettingsMenuOpen]);


  // Font loading
  const [loaded, error] = useFonts({
    Amiri_400Regular,
    Rubik_400Regular,
    BalooBhaijaan2_400Regular,
  });
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }
  return (
    <View
      className={`flex w-full h-full p-2 bg-${presentationSettings.backgroundColor}`}
      onPointerMove={() => {
        setIsPresentationSettingsIconShown(true); // Show menu icon on pointer move
      }}
    >
      {/* Hamburger Menu Icon */}
      {isPresentationSettingsIconShown && (
        <View className="absolute top-4 left-4 z-10 w-auto">
          <Pressable
            className="p-2 rounded-full w-auto h-auto"
            onPress={(e) => {
              e.stopPropagation(); // Prevent hiding on menu interaction
              setIsSettingsMenuOpen(!isSettingsMenuOpen); // Toggle settings menu
              //console.log("Settings Menu Open:", !isSettingsMenuOpen);
            }}
          >
            <Ionicons
              name="settings"
              size={30}
              className={`text-${presentationSettings.fontColor}`}
            />
          </Pressable>

          {/* Settings Menu */}
          {isSettingsMenuOpen && (
            <View
              onStartShouldSetResponder={() => true} // Capture touch events for menu
              onTouchStart={(e) => {
                e.stopPropagation(); // Stop propagation to avoid closing
                e.preventDefault(); // Prevent closing the menu when interacting
              }}
            >
              <PresentationSettingsMenu />
            </View>
          )}
        </View>
      )}

        {/* Hymn Text Display */}
        <Pressable
          className="flex-1 justify-center items-center cursor-default"
          onPress={(e) => {
            setIsPresentationSettingsIconShown(!isPresentationSettingsIconShown);
            setIsSettingsMenuOpen(false);
            // For mobile when user clicks on left and right side of the slides
            if(e.nativeEvent.pageX/screenWidth <= 0.25) {
              setCurrSlideIdx((currSlideIdx + slides.length - 1) % slides.length);
            } else if(e.nativeEvent.pageX/screenWidth >= 0.75) {
              setCurrSlideIdx((currSlideIdx + 1) % slides.length);
            }
          }}
        >

        {/* ScrollView needed for hymns with text that is long */}
        <ScrollView className="w-full h-full" contentContainerClassName="flex-grow justify-center">
            <Text
              className={`text-center text-${presentationSettings.fontColor}`}
              style={{
                fontFamily: presentationSettings.font,
                fontSize: presentationSettings.fontSize || 60,
              }}
              >
              {slides && slides.length > 0 && slides[currSlideIdx].lines.join("\n")}
            </Text>
          </ScrollView>
        </Pressable>
      <Text className={`absolute text-${presentationSettings.fontColor} bottom-0 text-xl m-2`}>{currSlideIdx + 1} | {slides.length}</Text>
    </View>
  );
}
