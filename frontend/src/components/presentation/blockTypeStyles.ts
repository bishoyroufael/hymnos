import type { CSSProperties } from "react";
import { BlockType } from "@/db/models";

interface BlockConfig {
  /** vh multiplier used in the full-screen clamp() calculation */
  vhScale: number;
  clampMinRem: number;
  clampMaxRem: number;
  /** Fixed font size used in the compact preview carousel */
  previewFontSize: string;
  opacity: number;
  fontWeight: number;
  lineHeight: number;
}

const BLOCK_CONFIG: Record<string, BlockConfig> = {
  [BlockType.h1]: {
    vhScale: 8,  clampMinRem: 1.5,  clampMaxRem: 16,
    previewFontSize: "1.5rem",  opacity: 0.7, fontWeight: 700, lineHeight: 1.5,
  },
  [BlockType.h2]: {
    vhScale: 6,  clampMinRem: 1.25, clampMaxRem: 14,
    previewFontSize: "1.25rem", opacity: 0.7, fontWeight: 600, lineHeight: 1.5,
  },
  [BlockType.h3]: {
    vhScale: 4,  clampMinRem: 1,    clampMaxRem: 12,
    previewFontSize: "1.1rem",  opacity: 0.7, fontWeight: 500, lineHeight: 1.5,
  },
  [BlockType.paragraph]: {
    vhScale: 8,  clampMinRem: 1,    clampMaxRem: 24,
    previewFontSize: "1rem",    opacity: 1.0, fontWeight: 400, lineHeight: 2.0,
  },
};

/** Block styling stored in slide_block.metadata, e.g. { type: "h1", align: "center" }. */
type BlockStyle = { type?: string; align?: string } | null | undefined;

function cfg(style: BlockStyle): BlockConfig {
  return BLOCK_CONFIG[style?.type ?? ""] ?? BLOCK_CONFIG[BlockType.paragraph];
}

function alignStyle(style: BlockStyle): CSSProperties {
  return style?.align ? { textAlign: style.align as CSSProperties["textAlign"] } : {};
}

/** Inline styles for a block rendered in the full-screen presentation. */
export function getFullSlideBlockStyle(style: BlockStyle, scale: number): CSSProperties {
  const c = cfg(style);
  return {
    fontSize: `clamp(${c.clampMinRem}rem, ${scale * c.vhScale}vh, ${c.clampMaxRem}rem)`,
    fontWeight: c.fontWeight,
    lineHeight: c.lineHeight,
    opacity: c.opacity,
    ...alignStyle(style),
  };
}

/** Inline styles for a block rendered in the compact slide preview carousel. */
export function getPreviewBlockStyle(style: BlockStyle): CSSProperties {
  const c = cfg(style);
  return {
    fontSize: c.previewFontSize,
    fontWeight: c.fontWeight,
    lineHeight: c.lineHeight,
    opacity: c.opacity,
    ...alignStyle(style),
  };
}
