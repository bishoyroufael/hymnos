import { Share } from "react-native";

export const shareText = async (message: string, url: string) => {
  try {
    await Share.share({
      message: message,
      url: url,
    });
  } catch (error) {
    console.error("Error sharing:", error);
  }
};