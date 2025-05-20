export function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export function generateHymnSlideObjects(N=10000) {
    if (typeof N !== 'number' || N <= 0) {
        throw new Error("Input must be a positive integer.");
    }

    const result = [];
    for (let i = 1; i <= N; i++) {
        const obj = {
            id: i, // Ensures uniqueness
            lines: generateRandomString(2500),
            chords: generateRandomString(2500),
            chords_pos: generateRandomString(2500)
        };
        result.push(obj);
    }
    return result;
}


// https://stackoverflow.com/questions/5224267/javascriptremove-arabic-text-diacritic-dynamically
export const normalize_text = function(text: string) {

  //remove special characters
  text = text.replace(/([^\u0621-\u063A\u0641-\u064A\u0660-\u0669a-zA-Z 0-9])/g, '');

  //normalize Arabic
  text = text.replace(/(آ|إ|أ)/g, 'ا');
  text = text.replace(/(ة)/g, 'ه');
  text = text.replace(/(ئ)/g, 'ء')
  text = text.replace(/(ؤ)/g, 'و')
  text = text.replace(/(ى)/g, 'ي');

  //convert arabic numerals to english counterparts.
  var starter = 0x660;
  for (var i = 0; i < 10; i++) {
    text.replace(String.fromCharCode(starter + i), String.fromCharCode(48 + i));
  }

  return text;
}

