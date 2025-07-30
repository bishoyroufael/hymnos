import ProgressBar from "@components/base/ProgressBar";
import { emitError, emitInfo } from "@utils/notification";
import { usePGliteContext } from "context/PGliteContext";
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, Button } from "react-native";

export default function DumpDb({ props }) {
  const { db } = usePGliteContext();
  const [result, setResult] = useState(null);
  const [queryText, setQueryText] = useState("");
  const [copyPastText, setCopyPastText] = useState("");
  useEffect(() => {}, []);

  const execute = async () => {
    try {
      const s = performance.now();
      const res = await db.transaction(async (tx) => {
        const res = tx.query(queryText);
        return res;
      });
      const e = performance.now();
      emitInfo(`took: ${e - s}ms`);
      setResult(res);
    } catch (error) {
      setResult(error);
    }
  };

  return (
    <View className="flex w-full h-full justify-center items-center gap-4">
        <ProgressBar />
      <View className="flex flex-row gap-2 w-full h-1/2">
        <TextInput
          placeholder="write query that will be executed"
          multiline
          numberOfLines={10}
          className="h-full outline flex-1 text-green-500 text-sm"
          value={queryText}
          onChangeText={(text) => setQueryText(text)}
        />

        <TextInput
          placeholder="copy paste text area"
          multiline
          numberOfLines={10}
          className="h-full outline flex-1"
          value={copyPastText}
          onChangeText={(text) => setCopyPastText(text)}
        />
      </View>

      <Button title="Execute!" onPress={execute} />
      <Text>Results:</Text>
      <ScrollView className="border w-full rounded-xl max-h-96">
        <Text>{JSON.stringify(result, null, 2)}</Text>
      </ScrollView>
    </View>
  );
}
