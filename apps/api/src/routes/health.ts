import { Hono } from "hono";
import type { Env, Variables } from "../types.js";

export const healthRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

healthRouter.get("/", async (c) => {
  const checks: Record<string, "ok" | "error"> = {
    api: "ok",
    database: "ok",
    cache: "ok",
  };

  // Check D1 database
  try {
    await c.env.DB.prepare("SELECT 1").first();
  } catch {
    checks.database = "error";
  }

  // Check KV
  try {
    await c.env.SCAN_CACHE.get("health-check");
  } catch {
    checks.cache = "error";
  }

  const healthy = Object.values(checks).every((v) => v === "ok");

  return c.json(
    {
      status: healthy ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    healthy ? 200 : 503
  );
});

healthRouter.get("/ready", (c) => {
  return c.json({ ready: true });
});

healthRouter.get("/live", (c) => {
  return c.json({ live: true });
});
