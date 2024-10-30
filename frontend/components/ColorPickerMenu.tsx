import React from "react";
import { View } from "react-native";

// https://stackoverflow.com/questions/71818458/why-wont-tailwind-find-my-dynamic-class
function ColorRow({ color }) {
  return (
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
  );
}

export default function ColorPickerMenu() {
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
  );
}
