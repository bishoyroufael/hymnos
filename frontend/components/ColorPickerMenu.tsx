import React from "react";
import { View } from "react-native";
import useHymnosState from "../global";
// https://stackoverflow.com/questions/71818458/why-wont-tailwind-find-my-dynamic-class

function ColorRow({ color, onSelectColor }: { color: string; onSelectColor: (color: string) => void }) {
  return (
    <View className="flex flex-row gap-x-1">
      {["100", "300", "500", "700", "900"].map((shade) => (
        <View
          key={shade}
          className={`bg-${color}-${shade} w-5 h-5 rounded-md border-gray-700 border hover:scale-110 transition duration-100 ease-in-out`}
          onStartShouldSetResponder={() => true} // Enables interaction for View
          onResponderRelease={() => onSelectColor(`${color}-${shade}`)} // Handles color selection
        />
      ))}
    </View>
  );
}

export default function ColorPickerMenu({ type }: { type: "background" | "font" }) {
  const { setPresentationSettings } = useHymnosState();

  const handleColorSelect = (color: string) => {
    //console.log(`Selected color: ${color}`);
    if (type === "background") {
      setPresentationSettings({ backgroundColor: color });
    } else if (type === "font") {
      setPresentationSettings({ fontColor: color });
    }
  };

  return (
    <View className="p-3 bg-slate-200 rounded-md space-y-3">
      <ColorRow color="blue" onSelectColor={handleColorSelect} />
      <ColorRow color="cyan" onSelectColor={handleColorSelect} />
      <ColorRow color="green" onSelectColor={handleColorSelect} />
      <ColorRow color="red" onSelectColor={handleColorSelect} />
      <ColorRow color="yellow" onSelectColor={handleColorSelect} />
      <ColorRow color="slate" onSelectColor={handleColorSelect} />
      <ColorRow color="gray" onSelectColor={handleColorSelect} />
    </View>
  );
}


/*
function ColorRow({ color, onSelectColor }: { color: string; onSelectColor: (color: string) => void }) {
    return(
    <View className="flex flex-row gap-x-1">
      <Pressable
        className={`bg-${color}-100 w-5 h-5 rounded-md border-gray-700 border hover:scale-110 transition duration-100 ease-in-out`}
        onPress={() => onSelectColor(`${color}-100`)}
      />
      <Pressable
        className={`bg-${color}-300 w-5 h-5 rounded-md border-gray-700 border hover:scale-110 transition duration-100 ease-in-out`}
        onPress={() => onSelectColor(`${color}-300`)}
      />
      <Pressable
        className={`bg-${color}-500 w-5 h-5 rounded-md border-gray-700 border hover:scale-110 transition duration-100 ease-in-out`}
        onPress={() => onSelectColor(`${color}-500`)}
      />
      <Pressable
        className={`bg-${color}-700 w-5 h-5 rounded-md border-gray-700 border hover:scale-110 transition duration-100 ease-in-out`}
        onPress={() => onSelectColor(`${color}-700`)}
      />
      <Pressable
        className={`bg-${color}-900 w-5 h-5 rounded-md border-gray-700 border hover:scale-110 transition duration-100 ease-in-out`}
        onPress={() => onSelectColor(`${color}-900`)}
      />
    </View>
  );
}

export default function ColorPickerMenu({ type }: { type: "background" | "font" }) {
  const { setPresentationSettings } = useHymnosState();

  const handleColorSelect = (color: string) => {
    // Based on the type ('background' or 'font'), update the respective color
    if (type === "background") {
      setPresentationSettings({ backgroundColor: color });
    } else if (type === "font") {
      setPresentationSettings({ fontColor: color });
    }
  };

  return (
    <View className="p-3 bg-slate-200 rounded-md space-y-3">
      <ColorRow color="blue" onSelectColor={handleColorSelect} />
      <ColorRow color="cyan" onSelectColor={handleColorSelect} />
      <ColorRow color="green" onSelectColor={handleColorSelect} />
      <ColorRow color="red" onSelectColor={handleColorSelect} />
      <ColorRow color="yellow" onSelectColor={handleColorSelect} />
      <ColorRow color="slate" onSelectColor={handleColorSelect} />
      <ColorRow color="gray" onSelectColor={handleColorSelect} />
    </View>
  );
}*/