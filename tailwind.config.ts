import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: colors.sky,
        secondary: colors.teal,
        accent: colors.orange,
        neutral: colors.neutral,
      },
      fontFamily: {
        heading: ["Montserrat", "sans-serif"],
        sans: ["Open Sans", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
} satisfies Config;
