export function generateRandomString(length) {
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

export function generateWordPrefixes(sentence: string): string[] {
  const words = sentence.trim().split(/\s+/);
  const result = new Set<string>();

  let i = 0;
  while (i < words.length) {
    let currentWord = words[i];
    let j = i;

    // Always include the individual word
    result.add(currentWord);

    // Check for consecutive identical words
    while (j + 1 < words.length && words[j + 1] === currentWord) {
      j++;
      // Include combinations like "okay okay", "okay okay okay", etc.
      const repeated = words.slice(i, j + 1).join(" ");
      result.add(repeated);
    }

    i = j + 1;
  }

  return new Array(...result);
}
