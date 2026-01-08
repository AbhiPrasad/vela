import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import type { User, Session } from "./db/schema.js";

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

  // Auth configuration
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  WEB_URL?: string; // Frontend URL for trusted origins (e.g., http://localhost:4321)
}

/**
 * Hono app context variables
 */
export interface Variables {
  requestId: string;
  user: User | null;
  session: Session | null;
}
