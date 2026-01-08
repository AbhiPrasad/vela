import { Hono } from "hono";
import { createAuth } from "../lib/auth.js";
import type { Env, Variables } from "../types.js";

const authRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Mount better-auth handler for all auth routes
authRouter.all("/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

export { authRouter };
