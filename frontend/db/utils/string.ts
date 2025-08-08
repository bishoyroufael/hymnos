export function parseBibleReference(input: string) {
  if (!input || typeof input !== "string") {
    return { book: null, bookNumber: null, chapter: null, verse: null };
  }

  // Remove bidi/control characters that can scramble logical order in RTL text
  const BIDI_RE = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
  // Normalize a few colon variants to ASCII colon
  const COLON_RE = /[\uFF1A\u0589]/g;

  // sanitized keeps the original digits/letters (but without bidi marks)
  const sanitized = input.replace(BIDI_RE, "").replace(COLON_RE, ":").trim();

  // Map many Unicode digit ranges to ASCII digits for parsing (keeps same string length)
  function mapDigitsToAscii(str: string) {
    const ranges = [
      [0x30, 0x39], // ASCII 0-9
      [0x0660, 0x0669], // Arabic-Indic
      [0x06f0, 0x06f9], // Extended Arabic-Indic (Persian)
      [0x0966, 0x096f], // Devanagari
      [0x09e6, 0x09ef], // Bengali
      [0x0a66, 0x0a6f], // Gurmukhi
      [0x0ae6, 0x0aef], // Gujarati
      [0x0b66, 0x0b6f], // Oriya
      [0x0be6, 0x0bef], // Tamil
      [0x0c66, 0x0c6f], // Telugu
      [0x0ce6, 0x0cef], // Kannada
      [0x0d66, 0x0d6f], // Malayalam
      [0x0e50, 0x0e59], // Thai
      [0x0ed0, 0x0ed9], // Lao
      [0x1040, 0x1049], // Myanmar
      [0xff10, 0xff19], // Fullwidth digits
    ];

    return Array.from(str)
      .map((ch: string) => {
        const cp = ch.codePointAt(0);
        for (const [start, end] of ranges) {
          if (cp >= start && cp <= end) {
            return String(cp - start);
          }
        }
        return ch;
      })
      .join("");
  }

  const normalized = mapDigitsToAscii(sanitized);

  // Split left/right on the first colon in the normalized string
  const colonIndex = normalized.indexOf(":");
  let leftNorm = normalized;
  let leftSan = sanitized;
  let rightNorm = null;
  if (colonIndex !== -1) {
    leftNorm = normalized.slice(0, colonIndex).trim();
    leftSan = sanitized.slice(0, colonIndex).trim();
    rightNorm = normalized.slice(colonIndex + 1).trim();
  } else {
    leftNorm = normalized.trim();
    leftSan = sanitized.trim();
  }

  // Verse (number after colon) — take leading digits if present
  let verse = null;
  if (rightNorm) {
    const m = rightNorm.match(/^(\d+)/);
    if (m) verse = parseInt(m[1], 10);
  }

  // Detect trailing chapter in the left part (e.g., "Kings 1" or "١ ملوك ٥")
  let chapter = null;
  let bookPartNorm = leftNorm;
  let bookPartSan = leftSan;
  const trailingMatch = leftNorm.match(/(.+?)\s+(\d+)\s*$/);
  if (trailingMatch) {
    bookPartNorm = trailingMatch[1]; // normalized book text (no trailing chapter)
    // Use the length of the normalized book text to slice the sanitized (preserves original digits)
    bookPartSan = leftSan.slice(0, bookPartNorm.length);
    chapter = parseInt(trailingMatch[2], 10);
  }

  // Detect numeric prefix in the book part (e.g., "1 John" or "١ ملوك")
  let bookNumber = null;
  const prefixMatch = bookPartNorm.match(/^\s*(\d+)\s*(.+)$/);
  if (prefixMatch) {
    bookNumber = parseInt(prefixMatch[1], 10);
    // bookPartSan already contains the prefix exactly as in the original sanitized input
  }

  const book = (bookPartSan || "").trim() || null;

  return { book, bookNumber, chapter, verse };
}
