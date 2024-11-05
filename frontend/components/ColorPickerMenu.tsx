import React from "react";
import { View ,TouchableOpacity} from "react-native";
import useColorStore from "../useColorStore";
// https://stackoverflow.com/questions/71818458/why-wont-tailwind-find-my-dynamic-class
function ColorRow({ color }) {
  const setBackgroundColor = useColorStore((state) => state.setBackgroundColor);
  const setFontColor = useColorStore((state) => state.setFontColor);

  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {color.map((colorCode) => (
        <TouchableOpacity
          key={colorCode}
          onPress={() => {setBackgroundColor(colorCode);
            //setFontColor(colorCode) // Set font color too
          }}
          style={{
            backgroundColor: colorCode,
            width: 20,
            height: 20,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: "#4B5563", // gray-700
          }}
        />
      ))}
    </View>
  );
  /*return (
    <View className="flex flex-row gap-x-1">
      <View
        className={`bg-${color}-100 w-5 h-5 rounded-md border-gray-700 border hover:scale-110 transition duration-100 ease-in-out`}
      />
      <View
        className={`bg-${color}-300 w-5 h-5 rounded-md border-gray-700 border hover:scale-110 transition duration-100 ease-in-out`}
      />
      <View
        className={`bg-${color}-500 w-5 h-5 rounded-md border-gray-700 border hover:scale-110 transition duration-100 ease-in-out`}
      />
      <View
        className={`bg-${color}-700 w-5 h-5 rounded-md border-gray-700 border hover:scale-110 transition duration-100 ease-in-out`}
      />
      <View
        className={`bg-${color}-900 w-5 h-5 rounded-md border-gray-700 border hover:scale-110 transition duration-100 ease-in-out`}
      />
    </View>
  );*/
}

export default function ColorPickerMenu() {
  const backgroundColor = useColorStore((state) => state.backgroundColor);
 // const fontColor = useColorStore((state) => state.fontColor);
  return (
    <View style={{ backgroundColor, padding: 8, borderRadius: 8 }}>
      <ColorRow color={["#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#1e40af"]} /> {/* Blue shades */}
      <ColorRow color={["#cffafe", "#a5f3fc", "#67e8f9", "#22d3ee", "#06b6d4"]} /> {/* Cyan shades */}
      <ColorRow color={["#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#15803d"]} /> {/* Green shades */}
      <ColorRow color={["#fecaca", "#fca5a5", "#f87171", "#ef4444", "#991b1b"]} /> {/* Red shades */}
      <ColorRow color={["#fef9c3", "#fef08a", "#fde047", "#facc15", "#ca8a04"]} /> {/* Yellow shades */}
      <ColorRow color={["#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#1e293b"]} /> {/* Slate shades */}
      <ColorRow color={["#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af", "#374151"]} /> {/* Gray shades */}
    </View>
  );
  /*
  return (
    <View className="rounded-md bg-slate-200 p-2 flex-col gap-y-1">
      <ColorRow color={"blue"} />
      <ColorRow color={"cyan"} />
      <ColorRow color={"green"} />
      <ColorRow color={"red"} />
      <ColorRow color={"yellow"} />
      <ColorRow color={"slate"} />
      <ColorRow color={"gray"} />
    </View>
  );*/
}
