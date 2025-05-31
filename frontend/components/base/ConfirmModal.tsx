import HymnosText from "@components/base/HymnosText";
import React from "react";
import { View, Text, Modal, Pressable } from "react-native";

interface ConfirmModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title = "تأكيد",
  message = "هل تريد الاستمرار؟",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white rounded-xl p-6 w-80 space-y-4 shadow-xl">
          <HymnosText className="text-lg font-semibold text-gray-800">
            {title}
          </HymnosText>
          <HymnosText className="text-sm text-gray-600">{message}</HymnosText>
          <View className="flex flex-row-reverse justify-end space-x-2">
            <Pressable onPress={onCancel}>
              <HymnosText className="px-4 py-2 text-sm text-gray-600">
                إلغاء
              </HymnosText>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className="bg-green-400 rounded hover:bg-green-500 duration-100"
            >
              <HymnosText className="px-4 py-2 text-sm text-white">
                تأكيد
              </HymnosText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
