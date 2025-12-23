// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#6366f1", // The B-List Purple
          tesco: "#00539f",
          sainsburys: "#f06c00",
          asda: "#78be20",
          morrisons: "#004e37",
          aldi: "#002c77",
          lidl: "#ffcc00",
          waitrose: "#5b6734",
          mands: "#111111",
        },
      },
      borderRadius: {
        cartoon: "24px",
      },
      boxShadow: {
        cartoon: "0 8px 0 0 rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};
