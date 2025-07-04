import { components as OPENAPI } from "@db/models";
type Content = OPENAPI["schemas"]["Content"];
type Hymn = OPENAPI["schemas"]["Hymn"];
type Liturgy = OPENAPI["schemas"]["Liturgy"];
type Bible = OPENAPI["schemas"]["Bible"];
type Tag = OPENAPI["schemas"]["Tag"];
type Slide = OPENAPI["schemas"]["Slide"];
type SlideColumn = OPENAPI["schemas"]["SlideColumn"];
type TagAssignment = OPENAPI["schemas"]["TagAssignment"];
type Pack = OPENAPI["schemas"]["Pack"];
type PackItem = OPENAPI["schemas"]["PackItem"];

export function generateRandomString(length: number) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function generateHymnSlideObjects(N = 10000) {
  if (typeof N !== "number" || N <= 0) {
    throw new Error("Input must be a positive integer.");
  }

  const result = [];
  for (let i = 1; i <= N; i++) {
    const obj = {
      id: i, // Ensures uniqueness
      lines: generateRandomString(2500),
      chords: generateRandomString(2500),
      chords_pos: generateRandomString(2500),
    };
    result.push(obj);
  }
  return result;
}

// https://stackoverflow.com/questions/5224267/javascriptremove-arabic-text-diacritic-dynamically
var arabicNormChar = {
  ﻷ: "لا",
  ؤ: "و",
  ى: "ی",
  ي: "ی",
  ئ: "ی",
  أ: "ا",
  إ: "ا",
  آ: "ا",
  ٱ: "ا",
  ٳ: "ا",
  ة: "ه",
  ء: "",
  ـ: "",
  "ِ": "",
  "ْ": "",
  "ُ": "",
  "َ": "",
  "ّ": "",
  "ٍ": "",
  "ً": "",
  "ٌ": "",
  "ٓ": "",
  "ٰ": "",
  "ٔ": "",
  "�": "",
};

export const normalizeArabic = function (str: string) {
  return str
    .replace(/[^\u0000-\u007E]/g, function (a) {
      var retval = arabicNormChar[a];
      if (retval == undefined) {
        retval = a;
      }
      return retval;
    })
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[؟?.,،!()[\]{}\-:<>0-9\u0660-\u0669]/g, " ") //Remove all brackets, other un-needed chars and Arabic, English digits
    .replace(/ +(?= )/g, "") // Remove multiple white space if present in between
    .trim();
};

export function generateWordPrefixes(sentence: string) {
  const words = sentence.trim().split(/\s+/);
  const result = new Set<string>();

  // Add unigrams (single words)
  for (const word of words) {
    result.add(word);
  }

  // Add bigrams (pairs of adjacent words)
  for (let i = 0; i < words.length - 1; i++) {
    result.add(words[i] + " " + words[i + 1]);
  }

  return Array.from(result);
}

function escape(value: any): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
  return `${value}`;
}

function formatRows<T>(rows: T[], mapper: (item: T) => string[]): string {
  if (rows.length === 1) {
    return `(${mapper(rows[0]).join(", ")})`;
  }
  return rows.map((item) => `(${mapper(item).join(", ")})`).join(",\n");
}

// ========== Content ==========
export function insertContents(contents: Content | Content[]): string {
  const rows = Array.isArray(contents) ? contents : [contents];
  return (
    `INSERT INTO content (id, type, created_at) VALUES\n` +
    formatRows(rows, (c) => [
      escape(c.id),
      escape(c.type),
      c.created_at ? escape(c.created_at) : "DEFAULT",
    ]) +
    ";"
  );
}

// ========== Hymn ==========
export function insertHymns(hymns: Hymn | Hymn[]): string {
  const rows = Array.isArray(hymns) ? hymns : [hymns];
  return (
    `INSERT INTO hymn (id, name, author, composer) VALUES\n` +
    formatRows(rows, (h) => [
      escape(h.id),
      escape(h.name),
      escape(h.author),
      escape(h.composer),
    ]) +
    ";"
  );
}

// ========== Liturgy ==========
export function insertLiturgies(liturgies: Liturgy | Liturgy[]): string {
  const rows = Array.isArray(liturgies) ? liturgies : [liturgies];
  return (
    `INSERT INTO liturgy (id, name) VALUES\n` +
    formatRows(rows, (l) => [escape(l.id), escape(l.name)]) +
    ";"
  );
}

// ========== Bible ==========
export function insertBibleReadings(bibles: Bible | Bible[]): string {
  const rows = Array.isArray(bibles) ? bibles : [bibles];
  return (
    `INSERT INTO bible (id, reference, translation) VALUES\n` +
    formatRows(rows, (b) => [
      escape(b.id),
      escape(b.reference),
      escape(b.translation),
    ]) +
    ";"
  );
}

// ========== Pack ==========
export function insertPacks(packs: Pack | Pack[]): string {
  const rows = Array.isArray(packs) ? packs : [packs];
  return (
    `INSERT INTO pack (id, name, author, description, created_at) VALUES\n` +
    formatRows(rows, (p) => [
      escape(p.id),
      escape(p.name),
      escape(p.author),
      escape(p.description),
      p.created_at ? escape(p.created_at) : "DEFAULT",
    ]) +
    ";"
  );
}

// ========== PackItem ==========
export function insertPackItems(items: PackItem | PackItem[]): string {
  const rows = Array.isArray(items) ? items : [items];
  return (
    `INSERT INTO pack_item (pack_id, content_id) VALUES\n` +
    formatRows(rows, (i) => [escape(i.pack_id), escape(i.content_id)]) +
    ";"
  );
}

// ========== Slide ==========
export function insertSlides(slides: Slide | Slide[]): string {
  const rows = Array.isArray(slides) ? slides : [slides];
  return (
    `INSERT INTO slide (id, content_id, position) VALUES\n` +
    formatRows(rows, (s) => [
      escape(s.id),
      escape(s.content_id),
      escape(s.position),
    ]) +
    ";"
  );
}

// ========== SlideColumn ==========
export function insertSlideColumns(
  columns: SlideColumn | SlideColumn[],
): string {
  const rows = Array.isArray(columns) ? columns : [columns];
  return (
    `INSERT INTO slide_column (id, slide_id, position, content, header) VALUES\n` +
    formatRows(rows, (c) => [
      escape(c.id),
      escape(c.slide_id),
      escape(c.position),
      escape(c.content),
      escape(c.header),
    ]) +
    ";"
  );
}

// ========== Tag ==========
export function insertTags(tags: Tag | Tag[]): string {
  const rows = Array.isArray(tags) ? tags : [tags];
  return (
    `INSERT INTO tag (id, name) VALUES\n` +
    formatRows(rows, (t) => [escape(t.id), escape(t.name)]) +
    ";"
  );
}

// ========== TagAssignment ==========
export function insertTagAssignments(
  assignments: TagAssignment | TagAssignment[],
): string {
  const rows = Array.isArray(assignments) ? assignments : [assignments];
  return (
    `INSERT INTO tag_assignment (tag_id, content_id, content_type) VALUES\n` +
    formatRows(rows, (a) => [
      escape(a.tag_id),
      escape(a.content_id),
      escape(a.content_type),
    ]) +
    ";"
  );
}
