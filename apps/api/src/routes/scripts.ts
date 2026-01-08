import { Hono } from "hono";
import type { Env, Variables } from "../types.js";
import type { ScriptCategory } from "@vela/shared";
import { PatternService } from "../services/pattern.js";
import { createDb } from "../db/index.js";

export const scriptsRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

/**
 * GET /scripts - List all known scripts with optional filtering
 */
scriptsRouter.get("/", async (c) => {
  const category = c.req.query("category") as ScriptCategory | undefined;
  const vendor = c.req.query("vendor");
  const search = c.req.query("search");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50"), 100);
  const offset = parseInt(c.req.query("offset") ?? "0");

  const db = createDb(c.env.DB);
  const patternService = new PatternService(db);

  const patterns = await patternService.getAllPatterns({
    category,
    vendor,
    search,
    limit,
    offset,
  });

  // Get total count for pagination (without limit/offset)
  const allPatterns = await patternService.getAllPatterns({
    category,
    vendor,
    search,
  });
  const total = allPatterns.length;

  return c.json({
    scripts: patterns,
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
scriptsRouter.get("/categories", async (c) => {
  const db = createDb(c.env.DB);
  const patternService = new PatternService(db);

  const categories = await patternService.getCategories();

  // Ensure all standard categories are included
  const standardCategories: ScriptCategory[] = [
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

  const categoryMap = new Map(categories.map((c) => [c.category, c.count]));
  const result = standardCategories.map((category) => ({
    category,
    count: categoryMap.get(category) ?? 0,
  }));

  return c.json({
    categories: result,
  });
});

/**
 * GET /scripts/vendors - List all vendors
 */
scriptsRouter.get("/vendors", async (c) => {
  const db = createDb(c.env.DB);
  const patternService = new PatternService(db);

  const vendors = await patternService.getVendors();
  vendors.sort((a, b) => b.count - a.count);

  return c.json({ vendors });
});

/**
 * GET /scripts/:id - Get a specific script pattern
 */
scriptsRouter.get("/:id", async (c) => {
  const scriptId = c.req.param("id");

  const db = createDb(c.env.DB);
  const patternService = new PatternService(db);

  const pattern = await patternService.getPatternById(scriptId);

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

  const db = createDb(c.env.DB);
  const patternService = new PatternService(db);

  const result = await patternService.matchUrl(body.url);

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

  const db = createDb(c.env.DB);
  const patternService = new PatternService(db);

  const matchResults = await patternService.matchUrls(body.urls);

  const results = body.urls.map((url) => {
    const result = matchResults.get(url) ?? { pattern: null, confidence: 0 };
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
