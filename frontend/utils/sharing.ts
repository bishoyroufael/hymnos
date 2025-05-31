import { emitError } from "@utils/notification";
import { Share } from "react-native";

export const shareText = async (message: string, url: string) => {
  try {
    await Share.share({
      message: message,
      url: url,
    });
  } catch (error) {
    emitError("لا يمكن المشاركه علي هذا المتصفح");
    console.error("Error sharing:", error);
  }
};
