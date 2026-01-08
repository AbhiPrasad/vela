import { Hono } from "hono";
import type { Env, Variables } from "../types.js";
import type { ScriptCategory } from "@vela/shared";
import {
  allPatterns,
  getPatternById,
  getPatternsByCategory,
  getPatternsByVendor,
  searchPatterns,
  matchUrl,
} from "@vela/script-db";

export const scriptsRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

/**
 * GET /scripts - List all known scripts with optional filtering
 */
scriptsRouter.get("/", (c) => {
  const category = c.req.query("category") as ScriptCategory | undefined;
  const vendor = c.req.query("vendor");
  const search = c.req.query("search");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50"), 100);
  const offset = parseInt(c.req.query("offset") ?? "0");

  let patterns = allPatterns;

  // Apply filters
  if (category) {
    patterns = getPatternsByCategory(category);
  } else if (vendor) {
    patterns = getPatternsByVendor(vendor);
  } else if (search) {
    patterns = searchPatterns(search);
  }

  // Apply pagination
  const total = patterns.length;
  const paginatedPatterns = patterns.slice(offset, offset + limit);

  return c.json({
    scripts: paginatedPatterns,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
});

/**
 * GET /scripts/categories - List available categories
 */
scriptsRouter.get("/categories", (c) => {
  const categories: ScriptCategory[] = [
    "analytics",
    "advertising",
    "social",
    "customer-support",
    "ab-testing",
    "tag-manager",
    "cdn",
    "fonts",
    "video",
    "other",
  ];

  const categoryCounts = categories.map((category) => ({
    category,
    count: getPatternsByCategory(category).length,
  }));

  return c.json({
    categories: categoryCounts,
  });
});

/**
 * GET /scripts/vendors - List all vendors
 */
scriptsRouter.get("/vendors", (c) => {
  const vendorMap = new Map<string, number>();

  for (const pattern of allPatterns) {
    const count = vendorMap.get(pattern.vendor) ?? 0;
    vendorMap.set(pattern.vendor, count + 1);
  }

  const vendors = Array.from(vendorMap.entries())
    .map(([vendor, count]) => ({ vendor, count }))
    .sort((a, b) => b.count - a.count);

  return c.json({ vendors });
});

/**
 * GET /scripts/:id - Get a specific script pattern
 */
scriptsRouter.get("/:id", (c) => {
  const scriptId = c.req.param("id");
  const pattern = getPatternById(scriptId);

  if (!pattern) {
    return c.json({ error: "Script pattern not found" }, 404);
  }

  return c.json(pattern);
});

/**
 * POST /scripts/identify - Identify a script URL
 */
scriptsRouter.post("/identify", async (c) => {
  const body = await c.req.json<{ url: string }>();

  if (!body.url) {
    return c.json({ error: "URL is required" }, 400);
  }

  const result = matchUrl(body.url);

  if (!result.pattern) {
    return c.json({
      identified: false,
      message: "Script not found in database",
      url: body.url,
    });
  }

  return c.json({
    identified: true,
    confidence: result.confidence,
    script: result.pattern,
  });
});

/**
 * POST /scripts/identify-batch - Identify multiple script URLs
 */
scriptsRouter.post("/identify-batch", async (c) => {
  const body = await c.req.json<{ urls: string[] }>();

  if (!body.urls || !Array.isArray(body.urls)) {
    return c.json({ error: "URLs array is required" }, 400);
  }

  if (body.urls.length > 100) {
    return c.json({ error: "Maximum 100 URLs allowed per request" }, 400);
  }

  const results = body.urls.map((url) => {
    const result = matchUrl(url);
    return {
      url,
      identified: !!result.pattern,
      confidence: result.confidence,
      script: result.pattern,
    };
  });

  const identified = results.filter((r) => r.identified).length;

  return c.json({
    total: results.length,
    identified,
    unidentified: results.length - identified,
    results,
  });
});
