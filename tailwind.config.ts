import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0074F8", // sampled from the Poorprice.com logo artwork
          dark: "#0058C8",
          light: "#4D9DFF",
        },
        ink: {
          DEFAULT: "#1C1B1F",
          soft: "#4A4750",
          muted: "#78747C",
        },
        canvas: "#FFFFFF",
        surface: "#F6F5F8",
        line: "#E4E1E8",
        accent: {
          amber: "#F2A900",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,27,31,0.06), 0 1px 1px rgba(28,27,31,0.04)",
        popover: "0 12px 32px rgba(28,27,31,0.16)",
      },
      borderRadius: {
        card: "10px",
      },
      maxWidth: {
        shell: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
