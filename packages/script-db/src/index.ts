// Types
export type { ScriptPattern } from "./types.js";

// Pattern collections
export {
  allPatterns,
  analyticsPatterns,
  advertisingPatterns,
  socialPatterns,
  customerSupportPatterns,
  abTestingPatterns,
  tagManagerPatterns,
  cdnPatterns,
  fontPatterns,
} from "./patterns/index.js";

// Matcher utilities
export type { MatchResult } from "./matcher.js";
export {
  matchUrl,
  matchUrls,
  getPatternById,
  getPatternsByCategory,
  getPatternsByVendor,
  searchPatterns,
  isFirstParty,
  extractDomain,
} from "./matcher.js";
