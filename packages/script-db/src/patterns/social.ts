import type { ScriptPattern } from "../types.js";

export const socialPatterns: ScriptPattern[] = [
  {
    id: "facebook-sdk",
    name: "Facebook SDK",
    vendor: "Meta",
    category: "social",
    urlPatterns: [
      "*://connect.facebook.net/*/sdk.js",
      "*://connect.facebook.net/*/all.js",
    ],
    globalVariables: ["FB"],
    knownIssues: [
      "Large bundle size",
      "Tracks users even without interaction",
      "Can cause layout shift from social buttons",
    ],
    alternatives: ["Static share links"],
    docsUrl: "https://developers.facebook.com/docs/javascript/",
  },
  {
    id: "twitter-widgets",
    name: "Twitter/X Widgets",
    vendor: "X Corp",
    category: "social",
    urlPatterns: [
      "*://platform.twitter.com/widgets.js",
      "*://platform.x.com/widgets.js",
    ],
    globalVariables: ["twttr"],
    knownIssues: [
      "Can cause layout shift from embedded tweets",
      "Performance impact for multiple embeds",
    ],
    alternatives: ["Static screenshots", "Quoted text"],
    docsUrl: "https://developer.twitter.com/en/docs/twitter-for-websites",
  },
  {
    id: "linkedin-sdk",
    name: "LinkedIn SDK",
    vendor: "LinkedIn",
    category: "social",
    urlPatterns: [
      "*://platform.linkedin.com/in.js",
    ],
    globalVariables: ["IN"],
    knownIssues: [
      "Tracks users",
      "Can cause layout shift",
    ],
    alternatives: ["Static share links"],
    docsUrl: "https://docs.microsoft.com/en-us/linkedin/consumer/integrations/",
  },
  {
    id: "pinterest-sdk",
    name: "Pinterest SDK",
    vendor: "Pinterest",
    category: "social",
    urlPatterns: [
      "*://assets.pinterest.com/js/pinit.js",
      "*://assets.pinterest.com/js/pinit_main.js",
    ],
    globalVariables: ["PinUtils", "PIN"],
    knownIssues: [
      "Tracks users",
    ],
    alternatives: ["Static share links"],
    docsUrl: "https://developers.pinterest.com/docs/widgets/pin-it/",
  },
  {
    id: "instagram-embed",
    name: "Instagram Embed",
    vendor: "Meta",
    category: "social",
    urlPatterns: [
      "*://www.instagram.com/embed.js",
    ],
    globalVariables: ["instgrm"],
    knownIssues: [
      "Can cause significant layout shift",
      "Heavy performance impact",
      "Tracks users",
    ],
    alternatives: ["Static screenshots"],
    docsUrl: "https://developers.facebook.com/docs/instagram/embedding/",
  },
  {
    id: "youtube-iframe-api",
    name: "YouTube IFrame API",
    vendor: "Google",
    category: "social",
    urlPatterns: [
      "*://www.youtube.com/iframe_api",
      "*://www.youtube.com/player_api",
    ],
    globalVariables: ["YT", "onYouTubeIframeAPIReady"],
    knownIssues: [
      "Heavy iframe can impact performance",
      "Tracks users",
    ],
    alternatives: ["lite-youtube-embed", "Static thumbnails with click-to-load"],
    docsUrl: "https://developers.google.com/youtube/iframe_api_reference",
  },
  {
    id: "vimeo-player",
    name: "Vimeo Player",
    vendor: "Vimeo",
    category: "social",
    urlPatterns: [
      "*://player.vimeo.com/api/player.js",
      "*://f.vimeocdn.com/js/*",
    ],
    globalVariables: ["Vimeo"],
    knownIssues: [
      "Iframe embeds can impact performance",
    ],
    alternatives: ["Static thumbnails with click-to-load"],
    docsUrl: "https://developer.vimeo.com/player/sdk",
  },
  {
    id: "addthis",
    name: "AddThis",
    vendor: "Oracle",
    category: "social",
    urlPatterns: [
      "*://s7.addthis.com/*",
    ],
    globalVariables: ["addthis"],
    knownIssues: [
      "Heavy script bundle",
      "Tracks users across sites",
      "Performance impact",
    ],
    alternatives: ["Native share API", "Static share links"],
    docsUrl: "https://www.addthis.com/academy/",
  },
  {
    id: "sharethis",
    name: "ShareThis",
    vendor: "ShareThis",
    category: "social",
    urlPatterns: [
      "*://platform-api.sharethis.com/*",
      "*://buttons-config.sharethis.com/*",
    ],
    globalVariables: ["__sharethis__"],
    knownIssues: [
      "Tracks users across sites",
    ],
    alternatives: ["Native share API", "Static share links"],
    docsUrl: "https://sharethis.com/support/",
  },
];
