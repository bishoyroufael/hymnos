import { useMemo } from "react";
import { HiTrash } from "react-icons/hi";
import type { MenuItem } from "./KebabMenu";

interface UseRowMenuProps {
  rowId: string;
  isOnlyRow: boolean;
  onDelete: (rowId: string) => void;
}

export function useRowMenu({ rowId, isOnlyRow, onDelete }: UseRowMenuProps): MenuItem[] {
  return useMemo(
    () => [
      {
        label: "حذف الصف",
        icon: <HiTrash />,
        onClick: () => onDelete(rowId),
        variant: "danger" as const,
        disabled: isOnlyRow,
      },
    ],
    [rowId, isOnlyRow, onDelete]
  );
}
