import { FcAddRow } from "react-icons/fc";
import SlideRow from "./SlideRow";
import type { components } from "../../db/models";
import { usePresentation } from "../../contexts/PresentationContext";

type SlideView = components["schemas"]["SlideView"];

interface SlideContentProps {
  slide: SlideView;
}

export default function SlideContent({ slide }: SlideContentProps) {
  const { state, dispatch } = usePresentation();

  const renderHorizontalDivider = (row: any, rowIndex: number) => (
    <div key={`row-divider-${row.id}-${rowIndex}`} className="relative w-full h-px divider divider-vertical divider-neutral/50 p-4">
      {state.isEditingMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: "ADD_ROW", payload: { afterRowIndex: rowIndex } });
          }}
          className="btn btn-circle btn-sm btn-neutral animate-pulse transition hover:scale-126 duration-200"
          aria-label="Add row"
        >
          <FcAddRow className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  // Generate row elements with dividers using flatMap
  const isOnlyRow = slide.slide_rows.length <= 1;
  const rowElements = slide.slide_rows.flatMap((row, index, array) => {
    const elements = [<SlideRow key={row.id} rowData={row} isOnlyRow={isOnlyRow} />];

    // Add divider after (except for last item in non-edit mode)
    if (index < array.length - 1 || state.isEditingMode) {
      elements.push(renderHorizontalDivider(row, index));
    }

    return elements;
  });

  // Add divider before first item in edit mode
  if (state.isEditingMode && slide.slide_rows.length) {
    rowElements.unshift(renderHorizontalDivider(slide.slide_rows[0], -1));
  }

  return <div className={`w-11/12 h-11/12 p-4 flex flex-col overflow-auto no-scrollbar justify-center-safe`}>{rowElements}</div>;
}
