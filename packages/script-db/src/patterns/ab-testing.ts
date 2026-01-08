import type { ScriptPattern } from "../types.js";

export const abTestingPatterns: ScriptPattern[] = [
  {
    id: "google-optimize",
    name: "Google Optimize",
    vendor: "Google",
    category: "ab-testing",
    urlPatterns: [
      "*://www.googleoptimize.com/optimize.js*",
    ],
    globalVariables: ["google_optimize"],
    knownIssues: [
      "Discontinued - migrate to alternatives",
      "Can cause page flicker without anti-flicker snippet",
    ],
    alternatives: ["VWO", "Optimizely", "AB Tasty"],
    docsUrl: "https://support.google.com/optimize/answer/12979939",
  },
  {
    id: "optimizely",
    name: "Optimizely",
    vendor: "Optimizely",
    category: "ab-testing",
    urlPatterns: [
      "*://cdn.optimizely.com/*",
      "*://logx.optimizely.com/*",
    ],
    globalVariables: ["optimizely"],
    knownIssues: [
      "Render-blocking by default",
      "Can cause page flicker",
      "Large script size",
    ],
    alternatives: ["LaunchDarkly", "Split.io"],
    docsUrl: "https://docs.developers.optimizely.com/web-experimentation/docs",
  },
  {
    id: "vwo",
    name: "VWO (Visual Website Optimizer)",
    vendor: "Wingify",
    category: "ab-testing",
    urlPatterns: [
      "*://dev.visualwebsiteoptimizer.com/*",
      "*://*.visualwebsiteoptimizer.com/*",
    ],
    globalVariables: ["_vwo_code", "VWO"],
    knownIssues: [
      "Can cause page flicker",
      "Render-blocking",
    ],
    alternatives: ["Optimizely", "AB Tasty"],
    docsUrl: "https://developers.vwo.com/reference/introduction-1",
  },
  {
    id: "ab-tasty",
    name: "AB Tasty",
    vendor: "AB Tasty",
    category: "ab-testing",
    urlPatterns: [
      "*://try.abtasty.com/*",
      "*://*.abtasty.com/*",
    ],
    globalVariables: ["ABTasty"],
    knownIssues: [
      "Can cause page flicker",
    ],
    alternatives: ["Optimizely", "VWO"],
    docsUrl: "https://developers.abtasty.com/",
  },
  {
    id: "launchdarkly",
    name: "LaunchDarkly",
    vendor: "LaunchDarkly",
    category: "ab-testing",
    urlPatterns: [
      "*://app.launchdarkly.com/*",
      "*://clientsdk.launchdarkly.com/*",
    ],
    globalVariables: ["LDClient"],
    knownIssues: [
      "Primarily feature flags, not visual A/B",
    ],
    alternatives: [],
    docsUrl: "https://docs.launchdarkly.com/sdk/client-side/javascript",
  },
  {
    id: "split",
    name: "Split.io",
    vendor: "Split",
    category: "ab-testing",
    urlPatterns: [
      "*://cdn.split.io/*",
    ],
    globalVariables: ["splitio"],
    knownIssues: [],
    alternatives: ["LaunchDarkly"],
    docsUrl: "https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK",
  },
  {
    id: "convert",
    name: "Convert",
    vendor: "Convert Insights",
    category: "ab-testing",
    urlPatterns: [
      "*://cdn-3.convertexperiments.com/*",
      "*://*.convertexperiments.com/*",
    ],
    globalVariables: ["convert"],
    knownIssues: [
      "Can cause page flicker",
    ],
    alternatives: [],
    docsUrl: "https://support.convert.com/hc/en-us/articles/205159965",
  },
  {
    id: "kameleoon",
    name: "Kameleoon",
    vendor: "Kameleoon",
    category: "ab-testing",
    urlPatterns: [
      "*://*.kameleoon.eu/*",
      "*://*.kameleoon.com/*",
    ],
    globalVariables: ["Kameleoon"],
    knownIssues: [],
    alternatives: [],
    docsUrl: "https://developers.kameleoon.com/javascript-sdk.html",
  },
];
