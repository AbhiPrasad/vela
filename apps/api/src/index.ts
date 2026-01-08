import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import type { Env, Variables } from "./types.js";
import { scansRouter } from "./routes/scans.js";
import { scriptsRouter } from "./routes/scripts.js";
import { healthRouter } from "./routes/health.js";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Global middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

// Request ID middleware
app.use("*", async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  c.header("X-Request-Id", requestId);
  await next();
});

// Routes
app.route("/health", healthRouter);
app.route("/scans", scansRouter);
app.route("/scripts", scriptsRouter);

// Root endpoint
app.get("/", (c) => {
  return c.json({
    name: "Vela API",
    version: "0.0.1",
    description: "Third-party script auditor API",
    endpoints: {
      health: "/health",
      scans: "/scans",
      scripts: "/scripts",
    },
  });
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err.stack);
  return c.json(
    {
      error: "Internal Server Error",
      message:
        c.env.ENVIRONMENT === "development"
          ? err.message
          : "An unexpected error occurred",
      requestId: c.get("requestId"),
    },
    500
  );
});

export default app;
