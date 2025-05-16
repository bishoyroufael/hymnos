import React, { useState } from "react"
import { Pressable, View, ViewProps } from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons";
import ConfirmModal from "./ConfirmModal";
import { useConfirmModal } from "../hooks/useConfirmModal";

interface EditToolBoxProps extends ViewProps {
  hideThose?: string // space divided string of 'submit' 'cancel' 'delete'
  deleteIconClassName?: string,
  cancelIconClassName?: string,
  submitIconClassName?: string,
  showOnlyIf: boolean,
  cancelEditCallback?: () => void;
  deleteCallback?: () => void;
  submitEditCallback?: () => void;
}

export default function EditToolBox ({hideThose, deleteIconClassName, cancelIconClassName, submitIconClassName, showOnlyIf, cancelEditCallback, deleteCallback, submitEditCallback, ...rest}:EditToolBoxProps) {
  const confirmModal = useConfirmModal();

  return (
    <>
      {showOnlyIf && (
        <View {...rest}>

          {!hideThose?.includes('delete') && 
          <View>
              <Pressable
              className="p-2 rounded-full w-auto h-auto"
              onPress={(e) => {
                confirmModal.show(()=>{
                  deleteCallback?.();
                });
              }}
              >
                <Ionicons
                  name="trash-outline"
                  size={30}
                  className={deleteIconClassName}
                  />
              </Pressable>
          </View>}

          {!hideThose?.includes('cancel') &&
            <View>
              <Pressable
              className="p-2 rounded-full w-auto h-auto"
              onPress={(e) => {
                cancelEditCallback?.();
              }}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={30}
                  className={cancelIconClassName}
                  />
              </Pressable>
           </View>
          }

          {!hideThose?.includes('submit') &&
            <View>
              <Pressable
              className="p-2 rounded-full w-auto h-auto"
              onPress={(e) => {
                confirmModal.show(()=>{
                  submitEditCallback?.();
                });
              }}
              >
                <Ionicons
                  name="checkbox"
                  size={30}
                  className={submitIconClassName}
                  />
              </Pressable>
          </View>}
          {/* Confirm Modal */}
        </View>
      )}
      <ConfirmModal visible={confirmModal.visible} onConfirm={confirmModal.onConfirm} onCancel={confirmModal.hide}/>
    </>
  )
};

