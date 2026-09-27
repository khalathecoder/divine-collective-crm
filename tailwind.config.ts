import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#5b3a8e",
          dark: "#3d2560",
          light: "#8a6bb8",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
