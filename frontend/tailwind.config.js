/** @type {import('tailwindcss').Config} */
const usedColors = [
  "blue",
  "red",
  "green",
  "yellow",
  "emerland",
  "cyan",
  "orange",
  "gray",
  "slate",
];
module.exports = {
  darkMode: "class",
  // NOTE: Update this to include the paths to all of your component files.
  safelist: usedColors.map((c) =>
    Array.from(
      { length: 9 },
      (_, i) => `bg-${c}-${(i + 1) * 100} text-${c}-${(i + 1) * 100}`
    ).join(" ")
  ),
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
