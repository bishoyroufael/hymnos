import type { components } from "../../db/models";
import SlideBlock from "./SlideBlock";
import KebabMenu from "./KebabMenu";
import { useColumnMenu } from "./useColumnMenu";
import { usePresentation } from "../../contexts/PresentationContext";

type SlideColumnView = components["schemas"]["SlideColumnView"];

interface SlideColumnProps {
  columnData: SlideColumnView;
  rowId: string;
  isOnlyColumn: boolean;
}

export default function SlideColumn({ columnData, rowId, isOnlyColumn }: SlideColumnProps) {
  const { state, dispatch } = usePresentation();

  // KebabMenu items
  const menuItems = useColumnMenu({
    rowId,
    columnId: columnData.id,
    isOnlyColumn,
    currentLanguageId: columnData.language.id,
    languages: state.languages,
    onDelete: () => dispatch({ type: "DELETE_COLUMN", payload: { rowId, columnId: columnData.id } }),
    onLanguageChange: (columnId: string, languageId: string) => dispatch({ type: "UPDATE_COLUMN_LANGUAGE", payload: { columnId, languageId } }),
  });

  // Determine text direction based on language
  const direction = columnData.language.is_rtl ? "rtl" : "ltr";
  // const kebabMenuLocation = direction === "rtl" ? "right-0" : "left-0";

  return (
    <div dir={direction} className="relative w-full h-full flex flex-col">
      {/* KebabMenu - only show in editing mode */}
      {state.isEditingMode && (
        <div className={`absolute top-0 z-99 rtl:right-0 left-0 w-fit`} onClick={(e) => e.stopPropagation()}>
          <KebabMenu items={menuItems} size="sm" />
        </div>
      )}
      {columnData.blocks.map((block, index) => (
        <SlideBlock key={block.id} block={block} blockIndex={index} columnId={columnData.id} totalBlocks={columnData.blocks.length} />
      ))}
    </div>
  );
}
