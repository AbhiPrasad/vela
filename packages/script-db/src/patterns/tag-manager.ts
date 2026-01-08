import type { ScriptPattern } from "../types.js";

export const tagManagerPatterns: ScriptPattern[] = [
  {
    id: "google-tag-manager",
    name: "Google Tag Manager",
    vendor: "Google",
    category: "tag-manager",
    urlPatterns: [
      "*://www.googletagmanager.com/gtm.js*",
    ],
    globalVariables: ["google_tag_manager", "dataLayer"],
    knownIssues: [
      "Can load many additional scripts",
      "Hard to audit what's actually loaded",
      "Performance impact depends on container contents",
    ],
    alternatives: ["Direct script loading", "Zaraz (Cloudflare)"],
    docsUrl: "https://developers.google.com/tag-platform/tag-manager",
  },
  {
    id: "adobe-launch",
    name: "Adobe Launch (Experience Platform Tags)",
    vendor: "Adobe",
    category: "tag-manager",
    urlPatterns: [
      "*://assets.adobedtm.com/*",
    ],
    globalVariables: ["_satellite"],
    knownIssues: [
      "Can load many additional scripts",
      "Complex setup",
    ],
    alternatives: ["Google Tag Manager"],
    docsUrl: "https://experienceleague.adobe.com/docs/experience-platform/tags/home.html",
  },
  {
    id: "tealium",
    name: "Tealium iQ",
    vendor: "Tealium",
    category: "tag-manager",
    urlPatterns: [
      "*://tags.tiqcdn.com/*",
      "*://*.tealiumiq.com/*",
    ],
    globalVariables: ["utag", "utag_data"],
    knownIssues: [
      "Can load many additional scripts",
      "Enterprise complexity",
    ],
    alternatives: ["Google Tag Manager"],
    docsUrl: "https://docs.tealium.com/platforms/javascript/",
  },
  {
    id: "ensighten",
    name: "Ensighten",
    vendor: "Ensighten",
    category: "tag-manager",
    urlPatterns: [
      "*://nexus.ensighten.com/*",
    ],
    globalVariables: ["Bootstrapper"],
    knownIssues: [
      "Can load many additional scripts",
    ],
    alternatives: ["Google Tag Manager"],
    docsUrl: null,
  },
  {
    id: "segment-snippet",
    name: "Segment (via snippet)",
    vendor: "Twilio",
    category: "tag-manager",
    urlPatterns: [
      "*://cdn.segment.com/next-integrations/*",
    ],
    globalVariables: ["analytics"],
    knownIssues: [
      "Can load many downstream integrations",
      "Device-mode integrations add significant overhead",
    ],
    alternatives: ["Server-side Segment", "RudderStack"],
    docsUrl: "https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/",
  },
  {
    id: "commanders-act",
    name: "Commanders Act",
    vendor: "Commanders Act",
    category: "tag-manager",
    urlPatterns: [
      "*://cdn.tagcommander.com/*",
    ],
    globalVariables: ["tc_vars", "tC"],
    knownIssues: [],
    alternatives: [],
    docsUrl: "https://doc.commandersact.com/",
  },
];
