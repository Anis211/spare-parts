/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
    keyframes: {
      wave1: {
        "0%": { transform: "scaleY(1)" },
        "100%": { transform: "scaleY(0.5)" },
      },
      wave2: {
        "0%": { transform: "scaleY(0.3)" },
        "100%": { transform: "scaleY(0.6)" },
      },
      wave3: {
        "0%": { transform: "scaleY(0.6)" },
        "100%": { transform: "scaleY(0.8)" },
      },
      wave4: {
        "0%": { transform: "scaleY(0.2)" },
        "100%": { transform: "scaleY(0.5)" },
      },
    },
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  plugins: [],
};
