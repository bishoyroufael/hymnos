import { useMemo } from "react";
import { HiTrash, HiGlobeAlt } from "react-icons/hi";
import type { MenuItem } from "./KebabMenu";
import type { components } from "../../db/models";

type Language = components["schemas"]["Language"];

interface UseColumnMenuProps {
  rowId: string;
  columnId: string;
  isOnlyColumn: boolean;
  currentLanguageId?: string;
  languages: Language[];
  onDelete: (rowId: string, columnId: string) => void;
  onLanguageChange: (columnId: string, languageId: string) => void;
}

export function useColumnMenu({ rowId, columnId, isOnlyColumn, currentLanguageId, languages, onDelete, onLanguageChange }: UseColumnMenuProps): MenuItem[] {
  return useMemo(() => {
    const menuItems: MenuItem[] = [];

    // Language submenu items
    languages.forEach((lang) => {
      menuItems.push({
        label: `${lang.name} ${lang.id === currentLanguageId ? "✓" : ""}`,
        icon: <HiGlobeAlt />,
        onClick: () => onLanguageChange(columnId, lang.id),
        variant: "default" as const,
      });
    });

    // Delete option
    menuItems.push({
      label: "حذف العمود",
      icon: <HiTrash />,
      onClick: () => onDelete(rowId, columnId),
      variant: "danger" as const,
      disabled: isOnlyColumn,
    });

    return menuItems;
  }, [rowId, columnId, isOnlyColumn, currentLanguageId, languages, onDelete, onLanguageChange]);
}
