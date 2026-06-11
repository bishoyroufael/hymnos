import { useMemo } from "react";
import { HiTrash } from "react-icons/hi";
import type { MenuItem } from "./KebabMenu";

interface UseBlockMenuProps {
  columnId: string;
  blockId: string;
  isOnlyBlock: boolean;
  onDelete: (columnId: string, blockId: string) => void;
}

export function useBlockMenu({ columnId, blockId, isOnlyBlock, onDelete }: UseBlockMenuProps): MenuItem[] {
  return useMemo(
    () => [
      {
        label: "حذف الكتلة",
        icon: <HiTrash />,
        onClick: () => onDelete(columnId, blockId),
        variant: "danger" as const,
        disabled: isOnlyBlock,
      },
    ],
    [columnId, blockId, isOnlyBlock, onDelete]
  );
}
