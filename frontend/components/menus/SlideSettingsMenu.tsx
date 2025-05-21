import FontSizeAdjuster from "@components/base/FontSizeAdjuster";
import Menu from "@components/base/Menu";
import React from "react";
import useHymnosState from "../../global";
import ColorPickerMenu from "./ColorPickerMenu";
import FontMenu from "../base/FontMenu";

export default function SlideSettingsMenu() {
  // Access global state updater from Zustand
  const { setPresentationSettings, presentationSettings } = useHymnosState();

  const handleBackgroundColorSelect = (color: string) => {
    setPresentationSettings({ backgroundColor: color });
  };

  const handleFontColorSelect = (color: string) => {
    setPresentationSettings({ fontColor: color });
  };

  const handleFontSelect = (font: string) => {
    setPresentationSettings({ font: font });
  };
  // console.log("SLIDE SETTINGS MENU");
  return (
    <Menu
      className="min-w-52"
      title="Settings"
      items={[
        {
          title: "Background Color",
          nestedMenu: {
            title: "Select Color",
            customView: (
              <ColorPickerMenu
                onColorSelect={handleBackgroundColorSelect}
                currentColor={presentationSettings.backgroundColor}
              />
            ),
          },
        },
        {
          title: "Font Color",
          nestedMenu: {
            title: "Select Color",
            customView: (
              <ColorPickerMenu
                onColorSelect={handleFontColorSelect}
                currentColor={presentationSettings.fontColor}
              />
            ),
          },
        },
        {
          title: "Font Family",
          nestedMenu: {
            title: "Select Font",
            customView: <FontMenu onFontSelect={handleFontSelect} />,
          },
        },
        {
          title: "Font Size",
          itemCustomView: <FontSizeAdjuster />,
        },
      ]}
    />
  );
}
