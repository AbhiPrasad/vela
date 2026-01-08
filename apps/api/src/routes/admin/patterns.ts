import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Env, Variables } from "../../types.js";
import { PatternService, type PatternInput, type PatternFilters } from "../../services/pattern.js";
import { createDb } from "../../db/index.js";
import { requireEditor, requireAdmin } from "../../middleware/auth.js";

export const adminPatternsRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Apply editor-level auth to all routes
adminPatternsRouter.use("*", requireEditor);

const createPatternSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  vendor: z.string().min(1).max(100),
  category: z.enum([
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
  ]),
  urlPatterns: z.array(z.string()).min(1),
  globalVariables: z.array(z.string()).optional().default([]),
  knownIssues: z.array(z.string()).optional().default([]),
  alternatives: z.array(z.string()).optional().default([]),
  docsUrl: z.string().url().nullable().optional(),
});

const updatePatternSchema = createPatternSchema.partial().omit({ id: true });

/**
 * GET /admin/patterns - List all patterns (including inactive)
 */
adminPatternsRouter.get("/", async (c) => {
  const category = c.req.query("category");
  const vendor = c.req.query("vendor");
  const search = c.req.query("search");
  const includeInactive = c.req.query("includeInactive") === "true";
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50"), 100);
  const offset = parseInt(c.req.query("offset") ?? "0");

  const db = createDb(c.env.DB);
  const patternService = new PatternService(db);

  const patterns = await patternService.getAllPatterns({
    category: category as PatternFilters["category"],
    vendor,
    search,
    isActive: includeInactive ? undefined : true,
    limit,
    offset,
  });

  const allPatterns = await patternService.getAllPatterns({
    category: category as PatternFilters["category"],
    vendor,
    search,
    isActive: includeInactive ? undefined : true,
  });
  const total = allPatterns.length;

  return c.json({
    patterns,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
});

/**
 * POST /admin/patterns - Create a new pattern
 */
adminPatternsRouter.post(
  "/",
  zValidator("json", createPatternSchema),
  async (c) => {
    const input = c.req.valid("json") as PatternInput;
    const user = c.get("user");

    const db = createDb(c.env.DB);
    const patternService = new PatternService(db);

    // Check if pattern with this ID already exists
    const existing = await patternService.getPatternById(input.id);
    if (existing) {
      return c.json({ error: "Pattern with this ID already exists" }, 409);
    }

    const pattern = await patternService.createPattern(input, user?.id);

    return c.json({ pattern }, 201);
  }
);

/**
 * GET /admin/patterns/:id - Get a specific pattern
 */
adminPatternsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const db = createDb(c.env.DB);
  const patternService = new PatternService(db);

  const pattern = await patternService.getPatternById(id);

  if (!pattern) {
    return c.json({ error: "Pattern not found" }, 404);
  }

  return c.json({ pattern });
});

/**
 * PUT /admin/patterns/:id - Update a pattern
 */
adminPatternsRouter.put(
  "/:id",
  zValidator("json", updatePatternSchema),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const user = c.get("user");

    const db = createDb(c.env.DB);
    const patternService = new PatternService(db);

    const pattern = await patternService.updatePattern(id, input, user?.id);

    if (!pattern) {
      return c.json({ error: "Pattern not found" }, 404);
    }

    return c.json({ pattern });
  }
);

/**
 * DELETE /admin/patterns/:id - Soft delete a pattern
 */
adminPatternsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const db = createDb(c.env.DB);
  const patternService = new PatternService(db);

  const success = await patternService.deletePattern(id, user?.id);

  if (!success) {
    return c.json({ error: "Pattern not found" }, 404);
  }

  return c.json({ success: true });
});

/**
 * POST /admin/patterns/:id/restore - Restore a soft-deleted pattern
 */
adminPatternsRouter.post("/:id/restore", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const db = createDb(c.env.DB);
  const patternService = new PatternService(db);

  const pattern = await patternService.updatePattern(
    id,
    { /* empty update triggers isActive: true logic */ } as Partial<PatternInput>,
    user?.id
  );

  if (!pattern) {
    return c.json({ error: "Pattern not found" }, 404);
  }

  return c.json({ pattern });
});

/**
 * DELETE /admin/patterns/:id/permanent - Hard delete a pattern (admin only)
 */
adminPatternsRouter.delete("/:id/permanent", requireAdmin, async (c) => {
  const id = c.req.param("id");

  const db = createDb(c.env.DB);
  const patternService = new PatternService(db);

  const success = await patternService.hardDeletePattern(id);

  if (!success) {
    return c.json({ error: "Pattern not found" }, 404);
  }

  return c.json({ success: true });
});
