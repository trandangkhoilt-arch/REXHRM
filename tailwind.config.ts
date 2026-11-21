import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
          DEFAULT: "#1e40af",
        },
        navy: {
          800: "#0f172a",
          900: "#0b132b",
          950: "#080c1e",
        },
        surface: {
          light: "#f8fafc",
          DEFAULT: "#ffffff",
          muted: "#f1f5f9",
          border: "#e2e8f0",
        }
      },
      borderRadius: {
        card: "14px",
      },
      fontFamily: {
        sans: ["Inter", "Be Vietnam Pro", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
