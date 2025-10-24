/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",       // main HTML
    "./src/**/*.{js,jsx,ts,tsx}"  // all React components
  ],
  // theme: { extend: {} },
  plugins: [],
  theme: {
  extend: {
    colors: {
      red: { 400: "#ef4444" },
      blue: { 400: "#3b82f6" },
      yellow: { 400: "#facc15" },
      green: { 400: "#22c55e" },
    },
  },
},

};
