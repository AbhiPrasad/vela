import type { ScriptPattern } from "../types.js";

export const fontPatterns: ScriptPattern[] = [
  {
    id: "google-fonts",
    name: "Google Fonts",
    vendor: "Google",
    category: "fonts",
    urlPatterns: [
      "*://fonts.googleapis.com/*",
      "*://fonts.gstatic.com/*",
    ],
    globalVariables: [],
    knownIssues: [
      "Render-blocking by default",
      "Privacy concerns (IP logging)",
      "Additional DNS lookups",
    ],
    alternatives: ["Self-hosted fonts", "Bunny Fonts"],
    docsUrl: "https://developers.google.com/fonts/docs/getting_started",
  },
  {
    id: "adobe-fonts",
    name: "Adobe Fonts (Typekit)",
    vendor: "Adobe",
    category: "fonts",
    urlPatterns: [
      "*://use.typekit.net/*",
      "*://p.typekit.net/*",
    ],
    globalVariables: ["Typekit"],
    knownIssues: [
      "Can cause FOIT/FOUT",
      "Requires Adobe subscription",
    ],
    alternatives: ["Self-hosted fonts", "Google Fonts"],
    docsUrl: "https://helpx.adobe.com/fonts/using/add-fonts-website.html",
  },
  {
    id: "fontawesome-cdn",
    name: "Font Awesome (CDN)",
    vendor: "Fonticons",
    category: "fonts",
    urlPatterns: [
      "*://kit.fontawesome.com/*",
      "*://use.fontawesome.com/*",
      "*://cdnjs.cloudflare.com/ajax/libs/font-awesome/*",
    ],
    globalVariables: ["FontAwesome"],
    knownIssues: [
      "Large file size for few icons",
      "Consider subsetting or SVG sprites",
    ],
    alternatives: ["Heroicons", "Lucide", "Self-hosted SVG sprites"],
    docsUrl: "https://fontawesome.com/docs/web/setup/get-started",
  },
  {
    id: "fonts-com",
    name: "Fonts.com",
    vendor: "Monotype",
    category: "fonts",
    urlPatterns: [
      "*://fast.fonts.net/*",
    ],
    globalVariables: [],
    knownIssues: [
      "Can cause FOIT/FOUT",
    ],
    alternatives: ["Self-hosted fonts"],
    docsUrl: "https://www.fonts.com/web-fonts/support",
  },
  {
    id: "bunny-fonts",
    name: "Bunny Fonts",
    vendor: "BunnyWay",
    category: "fonts",
    urlPatterns: [
      "*://fonts.bunny.net/*",
    ],
    globalVariables: [],
    knownIssues: [],
    alternatives: [],
    docsUrl: "https://fonts.bunny.net/about",
  },
];
