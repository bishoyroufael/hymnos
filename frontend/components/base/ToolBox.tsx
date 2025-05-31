import { View, Pressable, ViewProps } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import ConfirmModal from "./ConfirmModal"; // your existing modal
import { useConfirmModal } from "@hooks/useConfirmModal";
import { useEffect } from "react";

interface ToolBoxAction {
  key: string;
  iconName: string;
  iconSize?: number;
  onPress: () => void;
  confirm?: boolean;
  iconClassName?: string;
  hidden?: boolean;
}

interface ToolBoxProps extends ViewProps {
  showOnlyIf: boolean;
  actions: ToolBoxAction[];
  onConfirmModalVisibleChange?: (visible: boolean) => void;
}

export default function ToolBox({
  showOnlyIf,
  actions,
  onConfirmModalVisibleChange,
  ...rest
}: ToolBoxProps) {
  const confirmModal = useConfirmModal();

  // sync visibility state with parent caller state
  useEffect(() => {
    onConfirmModalVisibleChange?.(confirmModal.visible);
  }, [confirmModal.visible, onConfirmModalVisibleChange]);

  if (!showOnlyIf || !actions.length) return null;

  const handlePress = (action: ToolBoxAction) => {
    if (action.confirm) {
      confirmModal.show(() => {
        action.onPress?.();
      });
    } else {
      action.onPress?.();
    }
  };

  return (
    <>
      <View {...rest}>
        {actions.map((action) =>
          !action.hidden ? (
            <View key={action.key}>
              <Pressable
                className="p-2 rounded-full w-auto h-auto"
                onPress={() => handlePress(action)}
              >
                <Feather
                  name={action.iconName as any}
                  size={action.iconSize || 25}
                  className={action.iconClassName}
                />
              </Pressable>
            </View>
          ) : null,
        )}
      </View>
      <ConfirmModal
        visible={confirmModal.visible}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.hide}
      />
    </>
  );
}
