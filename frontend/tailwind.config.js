/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0F172A",
          light: "#1E293B",
        },
        paper: "#F7F5F0",
        signal: {
          DEFAULT: "#F5A623",
          dark: "#D9900F",
        },
        risk: "#E4572E",
        safe: "#14B8A6",
        slate: {
          muted: "#64748B",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
}

