import type { D1Database, KVNamespace } from "@cloudflare/workers-types";

/**
 * Cloudflare Worker environment bindings
 */
export interface Env {
  // D1 Database
  DB: D1Database;

  // KV Namespaces
  SCAN_CACHE: KVNamespace;
  RATE_LIMIT: KVNamespace;

  // Browser Rendering
  BROWSER: Fetcher;

  // Environment variables
  ENVIRONMENT: string;
}

/**
 * Hono app context variables
 */
export interface Variables {
  requestId: string;
}
