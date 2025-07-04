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
  // safelist: usedColors.map((c) =>
  //   Array.from(
  //     { length: 9 },
  //     (_, i) =>
  //       `bg-${c}-${(i + 1) * 100} text-${c}-${(i + 1) * 100} focus:outline-${c}-${(i + 1) * 100}`,
  //   ).join(" "),
  // ),
  safelist: [
    {
      pattern:
        /outline-(blue|red|green|yellow|emerland|cyan|orange|gray|slate)-(100|200|300|400|500|600|700|800|900)/,
      variants: ["focus"],
    },
    {
      pattern:
        /text-(blue|red|green|yellow|emerland|cyan|orange|gray|slate)-(100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern:
        /border-(blue|red|green|yellow|emerland|cyan|orange|gray|slate)-(100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern:
        /bg-(blue|red|green|yellow|emerland|cyan|orange|gray|slate)-(100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /scrollbar-hide/,
    },
    {
      pattern: /opacity-(10|30|50|70|100)/,
    },
  ],
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
