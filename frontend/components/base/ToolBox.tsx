import { View, Pressable, ViewProps } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import ConfirmModal from "./ConfirmModal"; // your existing modal
import { useConfirmModal } from "@hooks/useConfirmModal";

interface ToolBoxAction {
  key: string;
  iconName: string;
  onPress: () => void;
  confirm?: boolean;
  iconClassName?: string;
  hidden?: boolean;
}

interface ToolBoxProps extends ViewProps {
  showOnlyIf: boolean;
  actions: ToolBoxAction[];
}

export default function ToolBox({
  showOnlyIf,
  actions,
  ...rest
}: ToolBoxProps) {
  const confirmModal = useConfirmModal();

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
                  size={25}
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
