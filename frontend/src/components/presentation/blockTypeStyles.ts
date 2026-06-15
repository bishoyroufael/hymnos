import { BlockType } from "@/db/models";

/** Block styling stored in slide_block.metadata, e.g. { type: "h1", align: "center" }. */
type BlockStyle = { type?: string; align?: string } | null | undefined;

// Full-screen presentation classes. The font size scales with the `--font-scale`
// CSS variable (set on the slide container from the user's font-size setting) via
// a clamp(), so it stays a static, JIT-discoverable arbitrary value while still
// responding to the setting at runtime.
const FULL_CLASSES: Record<string, string> = {
  [BlockType.h1]: "text-[clamp(1.5rem,calc(var(--font-scale,1)*8vh),16rem)] font-bold leading-normal text-primary",
  [BlockType.h2]: "text-[clamp(1.25rem,calc(var(--font-scale,1)*6vh),14rem)] font-semibold leading-normal text-primary",
  [BlockType.h3]: "text-[clamp(1rem,calc(var(--font-scale,1)*4vh),12rem)] font-medium leading-normal text-primary",
  [BlockType.paragraph]: "text-[clamp(1rem,calc(var(--font-scale,1)*8vh),24rem)] font-normal leading-loose",
};

// Compact preview-carousel classes (fixed sizes, no scaling).
const PREVIEW_CLASSES: Record<string, string> = {
  [BlockType.h1]: "text-[1.5rem] font-bold leading-normal text-primary",
  [BlockType.h2]: "text-[1.25rem] font-semibold leading-normal text-primary",
  [BlockType.h3]: "text-[1.1rem] font-medium leading-normal text-primary",
  [BlockType.paragraph]: "text-[1rem] font-normal leading-loose",
};

const ALIGN_CLASSES: Record<string, string> = {
  center: "text-center",
  left: "text-left",
  right: "text-right",
};

function blockClasses(map: Record<string, string>, style: BlockStyle): string {
  const base = map[style?.type ?? ""] ?? map[BlockType.paragraph];
  const align = ALIGN_CLASSES[style?.align ?? "center"] ?? ALIGN_CLASSES.center;
  return `${base} ${align}`;
}

/** Tailwind classes for a block in the full-screen presentation. */
export function getFullSlideBlockClass(style: BlockStyle): string {
  return blockClasses(FULL_CLASSES, style);
}

/** Tailwind classes for a block in the compact slide preview carousel. */
export function getPreviewBlockClass(style: BlockStyle): string {
  return blockClasses(PREVIEW_CLASSES, style);
}
