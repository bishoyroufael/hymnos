import React, { useEffect, useState } from "react"
import { View } from "react-native"
import useHymnosState from "../global";


export default function ProgressBar () {
    const {syncProgressPercentage} = useHymnosState()

  return (
    <View className={`w-full bg-gray-200 rounded-full h-1.5 mb-4 dark:bg-gray-700 transition-opacity duration-1000 ease-in-out`} style={{opacity: syncProgressPercentage == 100 || syncProgressPercentage == 0 ? 0 : 1}}>
        <View className="bg-blue-600 h-1.5 rounded-full dark:bg-blue-500  transition-[width] duration-1000 delay-200 ease-in-out" style={{width: `${syncProgressPercentage}%`}}/>
    </View>
  )
};

