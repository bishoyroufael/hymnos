import type { components } from "@/db/models";
import { getPreviewBlockStyle } from "./blockTypeStyles";
import { SlideBlockContent } from "./SlideBlock";

type SlideView = components["schemas"]["SlideView"];
type SlideColumnView = components["schemas"]["SlideColumnView"];

export default function PreviewSlide({ slide }: { slide: SlideView }) {
  return (
    <div className="bg-base-300 w-full h-full flex flex-col items-center justify-center-safe gap-4 p-6 overflow-hidden select-none overflow-y-scroll">
      {slide.slide_rows.map((row) => (
        <div key={row.id} className="flex flex-row w-full gap-6">
          {row.slide_columns.map((col: SlideColumnView) => (
            <div key={col.id} dir={col.language.is_rtl ? "rtl" : "ltr"} className="flex flex-col flex-1 gap-1.5">
              {col.blocks.map((block) => (
                <SlideBlockContent
                  key={block.id}
                  blockId={block.id}
                  content={block.content}
                  disabled={true}
                  style={getPreviewBlockStyle(block.metadata)}
                  placeholder="لا يوجد محتوي"
                  className="cursor-default"
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
