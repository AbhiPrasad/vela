import type { ScriptCategory } from "@vela/shared";

/**
 * Pattern definition for identifying a third-party script
 */
export interface ScriptPattern {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Vendor/company name */
  vendor: string;
  /** Script category */
  category: ScriptCategory;
  /** URL patterns to match (supports * wildcard) */
  urlPatterns: string[];
  /** Global variables created by this script */
  globalVariables: string[];
  /** Known issues or concerns */
  knownIssues: string[];
  /** Recommended alternatives */
  alternatives: string[];
  /** Documentation URL */
  docsUrl: string | null;
}
