import type { CSSProperties } from "react";
import { FiPlus } from "react-icons/fi";
import { BlockType } from "../../db/models";
import { getFullSlideBlockStyle } from "./blockTypeStyles";
import CreateBlockMenu from "./CreateBlockMenu";
import KebabMenu from "./KebabMenu";
import { useBlockMenu } from "./useBlockMenu";
import { usePresentation } from "../../contexts/PresentationContext";
import useHymnosStore from "../../store";
import ContentEditableLib, { type ContentEditableEvent } from "react-contenteditable";

// react-contenteditable is a CommonJS module whose component lives under `.default`.
// Some bundlers (Vite 8 / Rolldown) don't auto-unwrap the CJS default, leaving the
// import as the module namespace object — so normalize it here.
const ContentEditable = (ContentEditableLib as unknown as { default?: typeof ContentEditableLib }).default ?? ContentEditableLib;

/** Shared block renderer used by both the full-screen slide and the preview carousel. */
export function SlideBlockContent({
  blockId,
  content,
  disabled,
  onChange,
  style,
  className = "",
  placeholder,
}: {
  blockId: string;
  content: string;
  disabled: boolean;
  onChange?: (e: ContentEditableEvent) => void;
  style: CSSProperties;
  className?: string;
  placeholder?: string;
}) {
  return (
    <ContentEditable
      id={blockId}
      html={content}
      onChange={onChange ?? (() => {})}
      disabled={disabled}
      data-placeholder={placeholder}
      className={`w-full text-center resize-none shrink-0 overflow-hidden whitespace-pre-wrap block bg-transparent border-none outline-none text-base-content ${className}`}
      style={style}
    />
  );
}

interface SlideBlockProps {
  block: {
    id: string;
    position: number;
    content: string;
    metadata?: { type?: BlockType; align?: string; [key: string]: unknown };
  };
  blockIndex: number;
  columnId: string;
  totalBlocks: number;
}

export default function SlideBlock({ block, blockIndex, columnId, totalBlocks }: SlideBlockProps) {
  const { state, dispatch } = usePresentation();
  const presentationSettings = useHymnosStore((s) => s.presentationSettings);

  // KebabMenu items
  const menuItems = useBlockMenu({
    columnId,
    blockId: block.id,
    isOnlyBlock: totalBlocks <= 1,
    onDelete: () => dispatch({ type: "DELETE_BLOCK", payload: { columnId, blockId: block.id } }),
  });

  const handleChange = (e: ContentEditableEvent) => {
    dispatch({ type: "UPDATE_BLOCK", payload: { blockId: block.id, content: e.target.value } });
  };

  const renderBlockDivider = (position: "before" | "after") => {
    if (!state.isEditingMode) return null;

    const targetIndex = position === "before" ? blockIndex - 1 : blockIndex;

    return (
      <div className="relative w-full p-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="dropdown dropdown-start">
            <div
              tabIndex={0}
              className="btn btn-circle btn-sm opacity-50 hover:opacity-100 hover:scale-125 ease-in-out transition duration-200 animate-pulse"
            >
              <FiPlus className="h-4 w-4" />
            </div>
            <div tabIndex={-1} className="dropdown-content z-99 mt-2">
              <CreateBlockMenu
                onSelectBlockType={(blockType) => {
                  dispatch({
                    type: "ADD_BLOCK",
                    payload: { columnId, afterBlockIndex: targetIndex, blockType },
                  });
                  // @ts-ignore
                  document.activeElement?.blur();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderBlockDivider("before")}
      <div className="relative w-full flex">
        {/* KebabMenu - only show in editing mode */}
        {state.isEditingMode && (
          <div className="absolute top-0 z-50 rtl:right-0 left-0 w-fit" onClick={(e) => e.stopPropagation()}>
            <KebabMenu items={menuItems} size="sm" />
          </div>
        )}
        <SlideBlockContent
          blockId={block.id}
          content={block.content}
          disabled={!state.isEditingMode}
          onChange={handleChange}
          placeholder={state.isEditingMode ? "اكتب..." : "لا يوجد محتوي"}
          style={getFullSlideBlockStyle(block.metadata, presentationSettings.fontSizeScale)}
          className={`${presentationSettings.fontFamily} ${state.isEditingMode ? "animate-pulse focus:ring-2 focus:ring-current rounded-lg cursor-text" : "cursor-default"}`}
        />
      </div>
      {renderBlockDivider("after")}
    </>
  );
}
