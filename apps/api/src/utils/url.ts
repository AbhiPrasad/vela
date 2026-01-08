/**
 * Convert a URL pattern with wildcards to a RegExp
 * Supports * as wildcard for any characters
 */
export function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape special regex chars except *
    .replace(/\*/g, ".*"); // Convert * to .*
  return new RegExp(`^${escaped}$`, "i");
}

/**
 * Check if a URL matches a pattern
 */
export function matchesPattern(url: string, pattern: string): boolean {
  const regex = patternToRegex(pattern);
  return regex.test(url);
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
