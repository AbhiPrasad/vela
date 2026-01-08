/**
 * Categories for third-party scripts
 */
export type ScriptCategory =
  | "analytics"
  | "advertising"
  | "social"
  | "customer-support"
  | "ab-testing"
  | "cdn"
  | "tag-manager"
  | "video"
  | "fonts"
  | "other";

/**
 * A detected third-party script on a page
 */
export interface ThirdPartyScript {
  /** Full URL of the script */
  url: string;
  /** Categorization of the script's purpose */
  category: ScriptCategory;
  /** Identified vendor name, if known */
  vendor: string | null;
  /** Hash of script content for fingerprinting */
  fingerprint: string;
  /** Confidence score of identification (0-1) */
  confidence: number;
  /** Whether the script was loaded async */
  async: boolean;
  /** Whether the script was loaded with defer */
  defer: boolean;
  /** Size of the script in bytes */
  sizeBytes: number;
}

/**
 * A known script in the database
 */
export interface KnownScript {
  id: string;
  /** Display name of the script/service */
  name: string;
  /** Company/vendor that provides the script */
  vendor: string;
  /** Primary category */
  category: ScriptCategory;
  /** URL patterns to match (glob patterns) */
  urlPatterns: string[];
  /** Content fingerprints for identification */
  contentFingerprints: string[];
  /** Global variables the script creates */
  globalVariables: string[];
  /** Known issues or concerns */
  knownIssues: string[];
  /** Suggested alternatives */
  alternatives: string[];
  /** Average main thread blocking time (ms) */
  avgMainThreadTime: number;
  /** Community rating (1-5) */
  communityRating: number;
}
