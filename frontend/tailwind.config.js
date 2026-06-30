/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // UrbanSynapse brand palette (from logo: deep navy / electric blue / gold)
        navy: "#0a1428",
        "navy-light": "#101d36",
        primary: "#2da3e0",
        accent: "#c9a227",
        "accent-2": "#7c4dff",
      },
    },
  },
  plugins: [],
};
