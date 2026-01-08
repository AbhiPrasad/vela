import type { ScriptPattern } from "../types.js";
import { analyticsPatterns } from "./analytics.js";
import { advertisingPatterns } from "./advertising.js";
import { socialPatterns } from "./social.js";
import { customerSupportPatterns } from "./customer-support.js";
import { abTestingPatterns } from "./ab-testing.js";
import { tagManagerPatterns } from "./tag-manager.js";
import { cdnPatterns } from "./cdn.js";
import { fontPatterns } from "./fonts.js";

/**
 * All known third-party script patterns
 */
export const allPatterns: ScriptPattern[] = [
  ...analyticsPatterns,
  ...advertisingPatterns,
  ...socialPatterns,
  ...customerSupportPatterns,
  ...abTestingPatterns,
  ...tagManagerPatterns,
  ...cdnPatterns,
  ...fontPatterns,
];

export {
  analyticsPatterns,
  advertisingPatterns,
  socialPatterns,
  customerSupportPatterns,
  abTestingPatterns,
  tagManagerPatterns,
  cdnPatterns,
  fontPatterns,
};
