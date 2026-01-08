/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        // Grade colors
        grade: {
          a: "#22c55e",
          b: "#84cc16",
          c: "#eab308",
          d: "#f97316",
          f: "#ef4444",
        },
        // Category colors
        category: {
          analytics: "#8b5cf6",
          advertising: "#f97316",
          social: "#3b82f6",
          "customer-support": "#10b981",
          "ab-testing": "#ec4899",
          "tag-manager": "#6366f1",
          cdn: "#64748b",
          fonts: "#14b8a6",
          video: "#ef4444",
          other: "#71717a",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "monospace"],
      },
    },
  },
  plugins: [],
};
