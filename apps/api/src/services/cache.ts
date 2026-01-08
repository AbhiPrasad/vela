import type { KVNamespace } from "@cloudflare/workers-types";
import type { ScanResult } from "@vela/shared";

const CACHE_TTL = 60 * 60 * 24; // 24 hours
const URL_CACHE_TTL = 60 * 60; // 1 hour for URL -> scan ID mapping

export class CacheService {
  constructor(private kv: KVNamespace) {}

  /**
   * Get a cached scan result by ID
   */
  async getScanResult(scanId: string): Promise<ScanResult | null> {
    const key = `scan:${scanId}`;
    const cached = await this.kv.get(key, "json");
    return cached as ScanResult | null;
  }

  /**
   * Cache a scan result
   */
  async setScanResult(result: ScanResult): Promise<void> {
    const key = `scan:${result.id}`;
    await this.kv.put(key, JSON.stringify(result), {
      expirationTtl: CACHE_TTL,
    });

    // Also cache URL -> scan ID mapping for deduplication
    if (result.status === "completed") {
      const urlKey = `url:${this.hashUrl(result.url)}`;
      await this.kv.put(urlKey, result.id, {
        expirationTtl: URL_CACHE_TTL,
      });
    }
  }

  /**
   * Get a recent scan for a URL (for deduplication)
   */
  async getScanByUrl(url: string): Promise<ScanResult | null> {
    const urlKey = `url:${this.hashUrl(url)}`;
    const scanId = await this.kv.get(urlKey);

    if (!scanId) {
      return null;
    }

    return this.getScanResult(scanId);
  }

  /**
   * Invalidate a cached scan
   */
  async invalidateScan(scanId: string): Promise<void> {
    const key = `scan:${scanId}`;
    await this.kv.delete(key);
  }

  /**
   * Simple URL hashing for cache keys
   */
  private hashUrl(url: string): string {
    // Normalize URL before hashing
    try {
      const parsed = new URL(url);
      const normalized = `${parsed.hostname}${parsed.pathname}${parsed.search}`;
      return this.simpleHash(normalized);
    } catch {
      return this.simpleHash(url);
    }
  }

  /**
   * Simple string hash (DJB2)
   */
  private simpleHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  }
}
