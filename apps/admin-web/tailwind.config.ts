import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f0ff",
          100: "#e3ddff",
          500: "#6b46e0",
          600: "#5934c4",
          700: "#472a9c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
