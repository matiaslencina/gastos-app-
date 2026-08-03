import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B1520",
          900: "#101F30",
          800: "#182B40",
        },
        paper: {
          100: "#F7F3E9",
          200: "#EFE8D6",
          300: "#E3D9BE",
        },
        led: {
          amber: "#F2B705",
          green: "#3FBF7F",
          red: "#E2543C",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        perforate:
          "radial-gradient(circle, #0B1520 2.5px, transparent 2.5px)",
      },
      backgroundSize: {
        perforate: "16px 16px",
      },
    },
  },
  plugins: [],
};
export default config;
