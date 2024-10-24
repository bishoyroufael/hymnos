import React, { useState, useEffect } from "react";
import { View, Text, FlatList, ScrollView } from "react-native";

interface Hymn {
  id: string;
  title: string;
}

interface HymnPackDetails {
  id: string;
  name: string;
  description: string;
  creator: string;
  dateCreated: string;
  hymns: Hymn[];
}

export default function HymnPack() {
  const [hymnPackDetails, setHymnPackDetails] =
    useState<HymnPackDetails | null>(null);

  // Fetch hymn pack details from backend
  useEffect(() => {
    fetchHymnPackDetails();
  }, []);

  const fetchHymnPackDetails = async () => {
    // Replace this with actual backend fetch
    const fetchedPack: HymnPackDetails = {
      id: "1",
      name: "Classic Hymns",
      description: "A collection of traditional church hymns",
      creator: "John Doe",
      dateCreated: "2024-01-01",
      hymns: [
        { id: "1", title: "Amazing Grace" },
        { id: "2", title: "How Great Thou Art" },
        { id: "3", title: "Holy, Holy, Holy" },
      ],
    };
    setHymnPackDetails(fetchedPack);
  };

  if (!hymnPackDetails) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex p-4 gap-y-4 w-3/4 border-2">
      <ScrollView className="flex p-4">
        {/* Hymn Pack Information */}
        <View className="mb-8">
          <Text className="text-2xl font-bold">{hymnPackDetails.name}</Text>
          <Text className="text-gray-700 mt-2">
            {hymnPackDetails.description}
          </Text>
          <Text className="text-gray-500 mt-4">
            Created by: {hymnPackDetails.creator}
          </Text>
          <Text className="text-gray-500">
            Date: {hymnPackDetails.dateCreated}
          </Text>
        </View>

        {/* Hymn Titles */}
        <View>
          <Text className="text-xl font-bold mb-4">Hymns in this Pack</Text>
          <FlatList
            data={hymnPackDetails.hymns}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="mb-2 p-4 bg-gray-100 rounded-lg">
                <Text className="font-semibold">{item.title}</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
}
