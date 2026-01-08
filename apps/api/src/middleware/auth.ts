import { createMiddleware } from "hono/factory";
import { createAuth } from "../lib/auth.js";
import type { Env, Variables } from "../types.js";

type UserRole = "user" | "editor" | "admin";

/**
 * Middleware to optionally attach user/session to context if authenticated
 */
export const optionalAuth = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const auth = createAuth(c.env);

  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session) {
      c.set("user", session.user as Variables["user"]);
      c.set("session", session.session as Variables["session"]);
    } else {
      c.set("user", null);
      c.set("session", null);
    }
  } catch {
    c.set("user", null);
    c.set("session", null);
  }

  await next();
});

/**
 * Middleware to require authentication
 */
export const requireAuth = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const auth = createAuth(c.env);

  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", session.user as Variables["user"]);
    c.set("session", session.session as Variables["session"]);
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});

/**
 * Middleware to require specific roles
 */
export const requireRole = (allowedRoles: UserRole[]) =>
  createMiddleware<{
    Bindings: Env;
    Variables: Variables;
  }>(async (c, next) => {
    const auth = createAuth(c.env);

    try {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const user = session.user as Variables["user"];
      const userRole = (user?.role ?? "user") as UserRole;

      if (!allowedRoles.includes(userRole)) {
        return c.json({ error: "Forbidden" }, 403);
      }

      c.set("user", user);
      c.set("session", session.session as Variables["session"]);
    } catch {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await next();
  });

/**
 * Convenience middleware for admin-only routes
 */
export const requireAdmin = requireRole(["admin"]);

/**
 * Convenience middleware for editor and admin routes
 */
export const requireEditor = requireRole(["editor", "admin"]);
