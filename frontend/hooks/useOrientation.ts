import { useEffect, useState } from "react";
import * as ScreenOrientation from "expo-screen-orientation";

export default function useOrientation() {
  const [orientation, setOrientation] =
    useState<ScreenOrientation.Orientation | null>(null);

  // Listen for orientation changes and update state
  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener(
      ({ orientationInfo }) => {
        setOrientation(orientationInfo.orientation);
      },
    );

    // Get the initial orientation
    ScreenOrientation.getOrientationAsync().then(setOrientation);

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  return { orientation, setOrientation };
}
