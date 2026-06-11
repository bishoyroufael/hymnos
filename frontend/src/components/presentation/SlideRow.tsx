import { FcAddColumn } from "react-icons/fc";
import KebabMenu from "./KebabMenu";
import { useRowMenu } from "./useRowMenu";
import SlideColumn from "./SlideColumn";
import type { components } from "../../db/models";
import { usePresentation } from "../../contexts/PresentationContext";

type SlideRowView = components["schemas"]["SlideRowView"];

interface SlideRowProps {
  rowData: SlideRowView;
  isOnlyRow: boolean;
}

export default function SlideRow({ rowData, isOnlyRow }: SlideRowProps) {
  const { state, dispatch } = usePresentation();

  // Row KebabMenu items
  const rowMenuItems = useRowMenu({
    rowId: rowData.id,
    isOnlyRow,
    onDelete: () => dispatch({ type: "DELETE_ROW", payload: { rowId: rowData.id } }),
  });

  const renderVerticalDivider = (colIndex: number) => (
    <div key={`col-divider-${rowData.id}-${colIndex}`} className="relative w-px divider divider-horizontal divider-neutral/50 p-4">
      {state.isEditingMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: "ADD_COLUMN", payload: { rowId: rowData.id, afterColumnIndex: colIndex } });
          }}
          className="btn btn-circle btn-sm btn-neutral animate-pulse transition hover:scale-125 duration-200"
          aria-label="Add column"
        >
          <FcAddColumn className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  // Generate column elements with dividers using flatMap
  const isOnlyColumn = rowData.slide_columns.length <= 1;
  const columnsWithDividers = rowData.slide_columns.flatMap((column, index, array) => {
    const elements = [<SlideColumn key={column.id} columnData={column} rowId={rowData.id} isOnlyColumn={isOnlyColumn} />];

    // Add divider after (except for last item in non-edit mode)
    if (index < array.length - 1 || state.isEditingMode) {
      elements.push(renderVerticalDivider(index));
    }

    return elements;
  });

  // Add divider before first item in edit mode
  if (state.isEditingMode && rowData.slide_columns.length) {
    columnsWithDividers.unshift(renderVerticalDivider(-1));
  }

  return (
    <div className="relative flex flex-row w-full">
      {/* Row KebabMenu - only show in editing mode */}
      {state.isEditingMode && (
        <div className="absolute top-2 right-0 z-99" onClick={(e) => e.stopPropagation()}>
          <KebabMenu items={rowMenuItems} size="sm" />
        </div>
      )}
      {columnsWithDividers}
    </div>
  );
}
