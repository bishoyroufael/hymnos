import HymnosText from "@components/base/HymnosText";
import { View } from "react-native";

export default function Footer() {
  return (
    <View className="w-full bg-gray-50 min-h-10 h-auto border justify-between text-center border-t border-gray-300 flex flex-col p-6 gap-2">
      <HymnosText className="self-center text-sky-800">
        "سَبْعَ مَرَّاتٍ فِي النَّهَارِ سَبَّحْتُكَ عَلَى أَحْكَامِ عَدْلِكَ."
        (مز ١١٩: ١٦٤)
      </HymnosText>
      <HymnosText className="self-center text-sky-800 font-light">
        @Hymnos 2025
      </HymnosText>
    </View>
  );
}
