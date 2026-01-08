import type { ScriptPattern } from "../types.js";

export const cdnPatterns: ScriptPattern[] = [
  {
    id: "cloudflare-cdn",
    name: "Cloudflare CDN",
    vendor: "Cloudflare",
    category: "cdn",
    urlPatterns: [
      "*://cdnjs.cloudflare.com/*",
    ],
    globalVariables: [],
    knownIssues: [],
    alternatives: [],
    docsUrl: "https://cdnjs.com/",
  },
  {
    id: "jsdelivr",
    name: "jsDelivr",
    vendor: "jsDelivr",
    category: "cdn",
    urlPatterns: [
      "*://cdn.jsdelivr.net/*",
    ],
    globalVariables: [],
    knownIssues: [],
    alternatives: ["unpkg", "cdnjs"],
    docsUrl: "https://www.jsdelivr.com/documentation",
  },
  {
    id: "unpkg",
    name: "unpkg",
    vendor: "unpkg",
    category: "cdn",
    urlPatterns: [
      "*://unpkg.com/*",
    ],
    globalVariables: [],
    knownIssues: [
      "No SLA for availability",
    ],
    alternatives: ["jsDelivr", "cdnjs"],
    docsUrl: "https://unpkg.com/",
  },
  {
    id: "jquery-cdn",
    name: "jQuery CDN",
    vendor: "OpenJS Foundation",
    category: "cdn",
    urlPatterns: [
      "*://code.jquery.com/*",
    ],
    globalVariables: ["jQuery", "$"],
    knownIssues: [
      "Large library size for modern web",
      "Often unnecessary with modern browsers",
    ],
    alternatives: ["Native DOM APIs", "Alpine.js"],
    docsUrl: "https://jquery.com/download/",
  },
  {
    id: "google-ajax-libs",
    name: "Google Hosted Libraries",
    vendor: "Google",
    category: "cdn",
    urlPatterns: [
      "*://ajax.googleapis.com/ajax/libs/*",
    ],
    globalVariables: [],
    knownIssues: [],
    alternatives: ["jsDelivr", "cdnjs"],
    docsUrl: "https://developers.google.com/speed/libraries",
  },
  {
    id: "microsoft-ajax-cdn",
    name: "Microsoft Ajax CDN",
    vendor: "Microsoft",
    category: "cdn",
    urlPatterns: [
      "*://ajax.aspnetcdn.com/*",
    ],
    globalVariables: [],
    knownIssues: [],
    alternatives: ["jsDelivr", "cdnjs"],
    docsUrl: "https://docs.microsoft.com/en-us/aspnet/ajax/cdn/overview",
  },
  {
    id: "bootstrap-cdn",
    name: "Bootstrap CDN",
    vendor: "Bootstrap",
    category: "cdn",
    urlPatterns: [
      "*://cdn.jsdelivr.net/npm/bootstrap*",
      "*://stackpath.bootstrapcdn.com/*",
      "*://maxcdn.bootstrapcdn.com/*",
    ],
    globalVariables: ["bootstrap"],
    knownIssues: [
      "Consider using only needed components",
    ],
    alternatives: ["Tailwind CSS", "Custom CSS"],
    docsUrl: "https://getbootstrap.com/docs/",
  },
];
