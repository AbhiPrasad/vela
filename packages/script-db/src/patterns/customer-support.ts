import type { ScriptPattern } from "../types.js";

export const customerSupportPatterns: ScriptPattern[] = [
  {
    id: "intercom",
    name: "Intercom",
    vendor: "Intercom",
    category: "customer-support",
    urlPatterns: [
      "*://widget.intercom.io/*",
      "*://js.intercomcdn.com/*",
      "*://api-iam.intercom.io/*",
    ],
    globalVariables: ["Intercom", "intercomSettings"],
    knownIssues: [
      "Large bundle size (~200KB+)",
      "Can cause layout shift from widget",
      "Continuous background connections",
    ],
    alternatives: ["Crisp", "Help Scout Beacon"],
    docsUrl: "https://developers.intercom.com/installing-intercom/docs/javascript-api-attributes-objects",
  },
  {
    id: "zendesk-web-widget",
    name: "Zendesk Web Widget",
    vendor: "Zendesk",
    category: "customer-support",
    urlPatterns: [
      "*://static.zdassets.com/*",
      "*://ekr.zdassets.com/*",
      "*://*.zendesk.com/embeddable/*",
    ],
    globalVariables: ["zE", "zESettings"],
    knownIssues: [
      "Heavy script bundle",
      "Can cause layout shift",
      "Multiple network requests",
    ],
    alternatives: ["Static contact form"],
    docsUrl: "https://developer.zendesk.com/documentation/zendesk-web-widget-sdks/",
  },
  {
    id: "drift",
    name: "Drift",
    vendor: "Drift (Salesloft)",
    category: "customer-support",
    urlPatterns: [
      "*://js.driftt.com/*",
      "*://js.drift.com/*",
    ],
    globalVariables: ["drift", "driftt"],
    knownIssues: [
      "Heavy script bundle",
      "Can cause layout shift from chat widget",
    ],
    alternatives: ["Intercom", "Crisp"],
    docsUrl: "https://devdocs.drift.com/docs/",
  },
  {
    id: "crisp",
    name: "Crisp",
    vendor: "Crisp",
    category: "customer-support",
    urlPatterns: [
      "*://client.crisp.chat/*",
    ],
    globalVariables: ["$crisp", "CRISP_WEBSITE_ID"],
    knownIssues: [
      "Can cause layout shift from widget",
    ],
    alternatives: [],
    docsUrl: "https://docs.crisp.chat/guides/chatbox-sdks/web-sdk/",
  },
  {
    id: "freshchat",
    name: "Freshchat",
    vendor: "Freshworks",
    category: "customer-support",
    urlPatterns: [
      "*://wchat.freshchat.com/*",
      "*://assetscdn-wchat.freshchat.com/*",
    ],
    globalVariables: ["fcWidget"],
    knownIssues: [
      "Can cause layout shift",
    ],
    alternatives: ["Crisp", "Intercom"],
    docsUrl: "https://developers.freshchat.com/web-sdk/",
  },
  {
    id: "hubspot-chat",
    name: "HubSpot Chat",
    vendor: "HubSpot",
    category: "customer-support",
    urlPatterns: [
      "*://js.hs-scripts.com/*",
      "*://js.usemessages.com/*",
      "*://js.hscollectedforms.net/*",
    ],
    globalVariables: ["HubSpotConversations", "hsConversationsSettings"],
    knownIssues: [
      "Often bundled with HubSpot tracking",
      "Heavy combined payload",
    ],
    alternatives: ["Standalone chat solutions"],
    docsUrl: "https://developers.hubspot.com/docs/api/conversation/chat-widget-sdk",
  },
  {
    id: "tawk",
    name: "Tawk.to",
    vendor: "Tawk.to",
    category: "customer-support",
    urlPatterns: [
      "*://embed.tawk.to/*",
    ],
    globalVariables: ["Tawk_API", "Tawk_LoadStart"],
    knownIssues: [
      "Can cause layout shift",
    ],
    alternatives: [],
    docsUrl: "https://developer.tawk.to/jsapi/",
  },
  {
    id: "livechat",
    name: "LiveChat",
    vendor: "LiveChat",
    category: "customer-support",
    urlPatterns: [
      "*://cdn.livechatinc.com/*",
    ],
    globalVariables: ["LiveChatWidget", "__lc"],
    knownIssues: [
      "Can cause layout shift from widget",
    ],
    alternatives: [],
    docsUrl: "https://developers.livechat.com/docs/extending-chat-widget/javascript-api/",
  },
  {
    id: "olark",
    name: "Olark",
    vendor: "Olark",
    category: "customer-support",
    urlPatterns: [
      "*://static.olark.com/*",
    ],
    globalVariables: ["olark"],
    knownIssues: [],
    alternatives: [],
    docsUrl: "https://www.olark.com/help/api",
  },
];
