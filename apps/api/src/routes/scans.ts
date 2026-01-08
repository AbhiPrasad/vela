import { Hono } from "hono";
import { validator } from "hono/validator";
import type { Env, Variables } from "../types.js";
import type { CreateScanRequest, ScanResult, ScanStatus } from "@vela/shared";
import { ScanService } from "../services/scan.js";
import { CacheService } from "../services/cache.js";
import { RateLimitService } from "../services/rate-limit.js";

export const scansRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Validation schema for URL
const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * POST /scans - Create a new scan
 */
scansRouter.post(
  "/",
  validator("json", (value, c) => {
    const body = value as CreateScanRequest;

    if (!body.url) {
      return c.json({ error: "URL is required" }, 400);
    }

    if (!isValidUrl(body.url)) {
      return c.json({ error: "Invalid URL format" }, 400);
    }

    return body;
  }),
  async (c) => {
    const body = c.req.valid("json");
    const requestId = c.get("requestId");

    // Check rate limit
    const rateLimiter = new RateLimitService(c.env.RATE_LIMIT);
    const clientIp = c.req.header("CF-Connecting-IP") ?? "unknown";
    const allowed = await rateLimiter.checkLimit(clientIp);

    if (!allowed) {
      return c.json(
        {
          error: "Rate limit exceeded",
          message: "Please wait before making another request",
        },
        429
      );
    }

    // Check cache for existing recent scan
    const cache = new CacheService(c.env.SCAN_CACHE);
    const cachedResult = await cache.getScanByUrl(body.url);

    if (cachedResult) {
      return c.json({
        id: cachedResult.id,
        status: cachedResult.status,
        cached: true,
        message: "Recent scan found in cache",
      });
    }

    // Create new scan
    const scanService = new ScanService(c.env.DB, c.env.BROWSER);

    try {
      const scan = await scanService.createScan(body.url);

      // Start the scan asynchronously
      c.executionCtx.waitUntil(
        scanService.executeScan(scan.id).then(async (result) => {
          // Cache the result
          await cache.setScanResult(result);
        })
      );

      return c.json(
        {
          id: scan.id,
          status: scan.status as ScanStatus,
          message: "Scan queued successfully",
        },
        202
      );
    } catch (error) {
      console.error("Failed to create scan:", error);
      return c.json(
        {
          error: "Failed to create scan",
          requestId,
        },
        500
      );
    }
  }
);

/**
 * GET /scans/:id - Get scan result
 */
scansRouter.get("/:id", async (c) => {
  const scanId = c.req.param("id");
  const requestId = c.get("requestId");

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(scanId)) {
    return c.json({ error: "Invalid scan ID format" }, 400);
  }

  // Check cache first
  const cache = new CacheService(c.env.SCAN_CACHE);
  const cachedResult = await cache.getScanResult(scanId);

  if (cachedResult) {
    return c.json(cachedResult);
  }

  // Fetch from database
  const scanService = new ScanService(c.env.DB, c.env.BROWSER);

  try {
    const scan = await scanService.getScan(scanId);

    if (!scan) {
      return c.json({ error: "Scan not found" }, 404);
    }

    // Cache completed scans
    if (scan.status === "completed" || scan.status === "failed") {
      await cache.setScanResult(scan);
    }

    return c.json(scan);
  } catch (error) {
    console.error("Failed to get scan:", error);
    return c.json(
      {
        error: "Failed to retrieve scan",
        requestId,
      },
      500
    );
  }
});

/**
 * GET /scans - List recent scans (limited)
 */
scansRouter.get("/", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "10"), 50);
  const offset = parseInt(c.req.query("offset") ?? "0");

  const scanService = new ScanService(c.env.DB, c.env.BROWSER);

  try {
    const scans = await scanService.listScans(limit, offset);

    return c.json({
      scans,
      pagination: {
        limit,
        offset,
        hasMore: scans.length === limit,
      },
    });
  } catch (error) {
    console.error("Failed to list scans:", error);
    return c.json(
      {
        error: "Failed to list scans",
        requestId: c.get("requestId"),
      },
      500
    );
  }
});
