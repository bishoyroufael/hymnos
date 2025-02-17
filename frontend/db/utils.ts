
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


