/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        // Blade Runner 2049 cyberpunk palette
        cyber: {
          black: "#050508",
          darker: "#0a0a0f",
          dark: "#12121a",
          mid: "#1a1a24",
          light: "#252530",
        },
        neon: {
          orange: "#ff6a00",
          amber: "#ff9e00",
          cyan: "#00d9ff",
          teal: "#0abdc6",
          pink: "#ff2d92",
          magenta: "#e91e8c",
          yellow: "#ffd700",
          red: "#ff3333",
        },
        // Grade colors - cyberpunk style
        grade: {
          a: "#00d9ff", // cyan
          b: "#0abdc6", // teal
          c: "#ffd700", // yellow
          d: "#ff6a00", // orange
          f: "#ff3333", // red
        },
        // Category colors - cyberpunk neons
        category: {
          analytics: "#e91e8c",
          advertising: "#ff6a00",
          social: "#00d9ff",
          "customer-support": "#0abdc6",
          "ab-testing": "#ff2d92",
          "tag-manager": "#ff9e00",
          cdn: "#6b7280",
          fonts: "#00d9ff",
          video: "#ff3333",
          other: "#6b7280",
        },
      },
      fontFamily: {
        sans: [
          "JetBrains Mono",
          "SF Mono",
          "Menlo",
          "Monaco",
          "monospace",
        ],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "monospace"],
        display: ["Orbitron", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "neon-orange": "0 0 5px #ff6a00, 0 0 20px rgba(255, 106, 0, 0.3)",
        "neon-cyan": "0 0 5px #00d9ff, 0 0 20px rgba(0, 217, 255, 0.3)",
        "neon-pink": "0 0 5px #ff2d92, 0 0 20px rgba(255, 45, 146, 0.3)",
        "neon-amber": "0 0 5px #ff9e00, 0 0 20px rgba(255, 158, 0, 0.3)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        flicker: "flicker 0.15s infinite",
        scanline: "scanline 8s linear infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.95" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};
