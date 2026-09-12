import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: "#14171C",
        "ink-soft": "#4B4A45",
        paper: "#F7F4EF",
        "paper-dim": "#EFEAE1",
        stone: "#CFC8BA",
        "stone-line": "#DAD4C6",
        bronze: "#96733A",
        "bronze-deep": "#6E5225",
        "bronze-tint": "#F1E6D2",
        "status-good": "#3D5A45",
        "status-good-bg": "#EEF2ED",
        "status-risk": "#8C4A3A",
        "status-risk-bg": "#F5E9E6",
      },
      fontFamily: {
        sans: ["var(--font-ibm-sans)", "sans-serif"],
        serif: ["var(--font-source-serif)", "serif"],
        mono: ["var(--font-ibm-mono)", "monospace"],
      },
      borderRadius: {
        card: "20px",
      },
    },
  },
  plugins: [],
};
export default config;
