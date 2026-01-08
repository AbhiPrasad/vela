import type { KVNamespace } from "@cloudflare/workers-types";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const WINDOW_SIZE = 60; // 1 minute window
const MAX_REQUESTS = 10; // 10 requests per minute

export class RateLimitService {
  constructor(private kv: KVNamespace) {}

  /**
   * Check if a request is allowed under rate limits
   * Returns true if allowed, false if rate limited
   */
  async checkLimit(identifier: string): Promise<boolean> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();

    const entry = await this.kv.get<RateLimitEntry>(key, "json");

    if (!entry || now > entry.resetAt) {
      // No entry or expired, create new window
      await this.kv.put(
        key,
        JSON.stringify({
          count: 1,
          resetAt: now + WINDOW_SIZE * 1000,
        }),
        { expirationTtl: WINDOW_SIZE }
      );
      return true;
    }

    if (entry.count >= MAX_REQUESTS) {
      return false;
    }

    // Increment count
    await this.kv.put(
      key,
      JSON.stringify({
        count: entry.count + 1,
        resetAt: entry.resetAt,
      }),
      { expirationTtl: Math.ceil((entry.resetAt - now) / 1000) }
    );

    return true;
  }

  /**
   * Get remaining requests for an identifier
   */
  async getRemaining(identifier: string): Promise<{
    remaining: number;
    resetAt: number;
  }> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();

    const entry = await this.kv.get<RateLimitEntry>(key, "json");

    if (!entry || now > entry.resetAt) {
      return {
        remaining: MAX_REQUESTS,
        resetAt: now + WINDOW_SIZE * 1000,
      };
    }

    return {
      remaining: Math.max(0, MAX_REQUESTS - entry.count),
      resetAt: entry.resetAt,
    };
  }

  /**
   * Reset rate limit for an identifier (admin use)
   */
  async resetLimit(identifier: string): Promise<void> {
    const key = `ratelimit:${identifier}`;
    await this.kv.delete(key);
  }
}
