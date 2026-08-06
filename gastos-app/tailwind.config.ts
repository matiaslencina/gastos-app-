import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07090A",
          900: "#0F1411",
          800: "#1A211C",
        },
        paper: {
          100: "#F5F6F4",
          200: "#E4E7E3",
          300: "#C7CDC8",
        },
        led: {
          amber: "#16A34A",
          green: "#22C55E",
          red: "#E5484D",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        perforate:
          "radial-gradient(circle, #07090A 2.5px, transparent 2.5px)",
      },
      backgroundSize: {
        perforate: "16px 16px",
      },
    },
  },
  plugins: [],
};
export default config;
