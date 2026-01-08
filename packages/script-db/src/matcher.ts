import type { ScriptCategory } from "@vela/shared";
import type { ScriptPattern } from "./types.js";
import { allPatterns } from "./patterns/index.js";

/**
 * Result of matching a URL against the script database
 */
export interface MatchResult {
  /** The matched pattern, or null if no match */
  pattern: ScriptPattern | null;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Convert a URL pattern with wildcards to a RegExp
 * Supports * as wildcard for any characters
 */
function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape special regex chars except *
    .replace(/\*/g, ".*"); // Convert * to .*
  return new RegExp(`^${escaped}$`, "i");
}

/**
 * Check if a URL matches a pattern
 */
function matchesPattern(url: string, pattern: string): boolean {
  const regex = patternToRegex(pattern);
  return regex.test(url);
}

/**
 * Find a matching script pattern for a given URL
 */
export function matchUrl(url: string): MatchResult {
  for (const pattern of allPatterns) {
    for (const urlPattern of pattern.urlPatterns) {
      if (matchesPattern(url, urlPattern)) {
        return {
          pattern,
          confidence: 1.0, // URL match is high confidence
        };
      }
    }
  }

  return {
    pattern: null,
    confidence: 0,
  };
}

/**
 * Find all matching patterns for a list of URLs
 */
export function matchUrls(urls: string[]): Map<string, MatchResult> {
  const results = new Map<string, MatchResult>();

  for (const url of urls) {
    results.set(url, matchUrl(url));
  }

  return results;
}

/**
 * Get a pattern by its ID
 */
export function getPatternById(id: string): ScriptPattern | null {
  return allPatterns.find((p) => p.id === id) ?? null;
}

/**
 * Get all patterns for a specific category
 */
export function getPatternsByCategory(category: ScriptCategory): ScriptPattern[] {
  return allPatterns.filter((p) => p.category === category);
}

/**
 * Get all patterns for a specific vendor
 */
export function getPatternsByVendor(vendor: string): ScriptPattern[] {
  return allPatterns.filter(
    (p) => p.vendor.toLowerCase() === vendor.toLowerCase()
  );
}

/**
 * Search patterns by name or vendor
 */
export function searchPatterns(query: string): ScriptPattern[] {
  const lowerQuery = query.toLowerCase();
  return allPatterns.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.vendor.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Check if a URL is a known first-party domain
 * Used to filter out first-party scripts
 */
export function isFirstParty(scriptUrl: string, pageUrl: string): boolean {
  try {
    const scriptHost = new URL(scriptUrl).hostname;
    const pageHost = new URL(pageUrl).hostname;

    // Same domain
    if (scriptHost === pageHost) {
      return true;
    }

    // Check if subdomain of same root domain
    const getBaseDomain = (host: string): string => {
      const parts = host.split(".");
      if (parts.length <= 2) return host;
      return parts.slice(-2).join(".");
    };

    return getBaseDomain(scriptHost) === getBaseDomain(pageHost);
  } catch {
    return false;
  }
}

/**
 * Extract the domain from a URL for display purposes
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
