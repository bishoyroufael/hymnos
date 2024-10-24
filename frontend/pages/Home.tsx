import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from "react-native";

interface HymnPack {
  id: string;
  name: string;
  description: string;
}

interface Hymn {
  id: string;
  title: string;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hymnPacks, setHymnPacks] = useState<HymnPack[]>([]);
  const [lastViewedHymns, setLastViewedHymns] = useState<Hymn[]>([]);

  // Fetch hymn packs from backend
  useEffect(() => {
    // Example fetching hymn packs from a backend
    fetchHymnPacks();
    fetchLastViewedHymns();
  }, []);

  const fetchHymnPacks = async () => {
    // Replace with your actual backend fetch
    const fetchedPacks: HymnPack[] = [
      {
        id: "1",
        name: "Classic Hymns",
        description: "Traditional church hymns",
      },
      {
        id: "2",
        name: "Modern Worship",
        description: "Contemporary worship songs",
      },
    ];
    setHymnPacks(fetchedPacks);
  };

  const fetchLastViewedHymns = async () => {
    // Replace with your actual backend fetch
    const fetchedHymns: Hymn[] = [
      { id: "1", title: "Amazing Grace" },
      { id: "2", title: "How Great Thou Art" },
    ];
    setLastViewedHymns(fetchedHymns);
  };

  return (
    <View className="flex p-4 gap-y-4 w-3/4 border-2">
      {/* Search Bar */}
      <View className="flex items-center justify-center mt-8 gap-y-4">
        <Text className="text-2xl font-bold">Hymnos</Text>
        <TextInput
          className="w-full p-4 border rounded-lg border-gray-300 text-lg"
          placeholder="Search Hymns..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Hymn Packs Section */}
      <View className="gap-y-4">
        <Text className="text-xl font-bold">Hymn Packs</Text>
        <FlatList
          data={hymnPacks}
          keyExtractor={(item) => item.id}
          horizontal
          renderItem={({ item }) => (
            <TouchableOpacity className="p-4 bg-gray-100 rounded-lg w-48 mr-2">
              <Text className="font-semibold">{item.name}</Text>
              <Text className="text-gray-600 mt-2">{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Last Viewed Hymns */}
      <View className="gap-y-4">
        <Text className="text-xl font-bold">Last Viewed Hymns</Text>
        <FlatList
          data={lastViewedHymns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="p-4 bg-gray-100 rounded-lg mb-2">
              <Text className="font-semibold">{item.title}</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}
