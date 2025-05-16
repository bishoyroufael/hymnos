import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';

interface ConfirmModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  onConfirm,
  onCancel
} : ConfirmModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white rounded-xl p-6 w-80 space-y-4 shadow-xl">
          <Text className="text-lg font-semibold text-gray-800">{title}</Text>
          <Text className="text-sm text-gray-600">{message}</Text>
          <View className="flex-row justify-end space-x-2">
            <Pressable onPress={onCancel}>
              <Text className="px-4 py-2 text-sm text-gray-600">Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} className="bg-green-400 rounded">
              <Text className="px-4 py-2 text-sm text-white">Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};