import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          500: "#3b5fe0",
          600: "#2d49c2",
          700: "#25399a",
        },
        debtor: {
          bg: "#fde8e8",
          border: "#f5b5b5",
          text: "#9b1c1c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
