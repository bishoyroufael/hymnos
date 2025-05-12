import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, Dimensions, TextInput, Keyboard } from "react-native";
import useHymnosState from "../../global";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { Cairo_400Regular } from "@expo-google-fonts/cairo";
import { Lateef_400Regular } from "@expo-google-fonts/lateef";
import { BalooBhaijaan2_400Regular } from "@expo-google-fonts/baloo-bhaijaan-2";
import { router, useLocalSearchParams} from "expo-router";
import { get_slides_of_hymn } from "../../db/dexie";
import { Slide } from "../../db/models";
import { useKeyEvent } from "expo-key-event";
import SlideSettingsIcon from "../../components/SlideSettingsIcon";
import SlideEditIcon from "../../components/SlideEditIcon";

const screenWidth = Dimensions.get('screen').width;

export default function HymnPresentation() {
  console.log("presentation screen rendered")
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
    isEditingMode,
    setIsEditingMode
  } = useHymnosState();

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currSlideIdx, setCurrSlideIdx] = useState<number>(0);
  const { keyEvent } = useKeyEvent();
  const [currentTextAreaValue, setCurrentTextAreaValue] = useState(null)  

  // https://medium.com/@oherterich/creating-a-textarea-with-dynamic-height-using-react-and-typescript-5ed2d78d9848
  // re-called if node ref is updated, current text value changed, or font is changed
  const textAreaRef = useCallback((node: HTMLTextAreaElement | null) => {
    if (node != null) {
      // We need to reset the height momentarily to get the correct scrollHeight for the textarea
      node.style.height = "0px";
      const scrollHeight = node.scrollHeight;
      // We then set the height directly, outside of the render loop
      // Trying to set this with state or a ref will product an incorrect value.
      node.style.height = scrollHeight + "px";
    }
  }, [currentTextAreaValue, presentationSettings])


  // Handling key events
  // re-runs on keyEvent change
  useEffect(()=>{
    if (!slides || slides.length === 0 || !keyEvent) return; // Handle edge case
    if (keyEvent && keyEvent.key === "Escape") {
        router.navigate("/");
    }
    setCurrSlideIdx((prevIdx) => {
      const newKey = keyEvent.key === 'ArrowRight'
                ? (prevIdx + 1) % slides.length
                : keyEvent.key === 'ArrowLeft'
                ? (prevIdx + slides.length - 1) % slides.length
                : prevIdx;

      setCurrentTextAreaValue(slides[newKey].lines.join("\n"))
      return newKey; // Return previous index if key is not handled
    });

  },[keyEvent])


  // Fetch hymn from db using uuid once
  useEffect(()=>{
    console.log("rerendering happens here!");
    get_slides_of_hymn(uuid)
      .then((s) => {setSlides(s); setCurrentTextAreaValue(s[0].lines.join("\n"))})
      .catch((e) => {console.log(e); router.navigate("/notfound");});
  }, [])



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
    Cairo_400Regular,
    BalooBhaijaan2_400Regular,
    Lateef_400Regular
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
        <SlideSettingsIcon/>
        <SlideEditIcon/>

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
          
          {slides && slides.length > 0 && 
          <TextInput
          readOnly
          caretHidden
          multiline={true}
          // @ts-ignore
          ref={textAreaRef}
          onChangeText={(updatedLineText)=>{
            const updatedSlide = slides[currSlideIdx]
            updatedSlide.lines = updatedLineText.split("\n")
            setSlides(slides.with(currSlideIdx, updatedSlide));
            setCurrentTextAreaValue(updatedLineText);
          }}
          className={`text-center text-${presentationSettings.fontColor} outline-none w-[80%] resize-none`}
          // ref={textareaRef}
          style={{
            fontFamily: presentationSettings.font,
            fontSize: presentationSettings.fontSize || 60
          }}
          value={currentTextAreaValue}/>}
      
        </Pressable>
      <Text className={`absolute text-${presentationSettings.fontColor} bottom-0 text-xl m-2`}>{currSlideIdx + 1} | {slides.length}</Text>
    </View>
  );
}
