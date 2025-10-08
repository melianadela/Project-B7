/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // <— penting untuk toggle manual
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
