import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import type { Env, Variables } from "../../types.js";
import { createDb } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { requireAdmin } from "../../middleware/auth.js";

export const adminUsersRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

// All user management routes require admin role
adminUsersRouter.use("*", requireAdmin);

const updateRoleSchema = z.object({
  role: z.enum(["user", "editor", "admin"]),
});

/**
 * GET /admin/users - List all users
 */
adminUsersRouter.get("/", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50"), 100);
  const offset = parseInt(c.req.query("offset") ?? "0");

  const db = createDb(c.env.DB);

  const allUsers = await db.select().from(users);
  const paginatedUsers = await db
    .select()
    .from(users)
    .limit(limit)
    .offset(offset);

  // Remove sensitive fields
  const sanitizedUsers = paginatedUsers.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    image: user.image,
    createdAt: user.createdAt,
  }));

  return c.json({
    users: sanitizedUsers,
    pagination: {
      total: allUsers.length,
      limit,
      offset,
      hasMore: offset + limit < allUsers.length,
    },
  });
});

/**
 * GET /admin/users/:id - Get a specific user
 */
adminUsersRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const db = createDb(c.env.DB);

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  const user = result[0];

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
    },
  });
});

/**
 * PUT /admin/users/:id/role - Update a user's role
 */
adminUsersRouter.put(
  "/:id/role",
  zValidator("json", updateRoleSchema),
  async (c) => {
    const id = c.req.param("id");
    const { role } = c.req.valid("json");
    const currentUser = c.get("user");

    // Prevent self-demotion
    if (currentUser?.id === id && role !== "admin") {
      return c.json({ error: "Cannot change your own admin role" }, 400);
    }

    const db = createDb(c.env.DB);

    // Check if user exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    const existingUser = existing[0];

    if (!existingUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Update role
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id));

    return c.json({
      success: true,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role,
      },
    });
  }
);

/**
 * DELETE /admin/users/:id - Delete a user
 */
adminUsersRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const currentUser = c.get("user");

  // Prevent self-deletion
  if (currentUser?.id === id) {
    return c.json({ error: "Cannot delete your own account" }, 400);
  }

  const db = createDb(c.env.DB);

  // Check if user exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (existing.length === 0) {
    return c.json({ error: "User not found" }, 404);
  }

  // Delete user (cascades to sessions and accounts)
  await db.delete(users).where(eq(users.id, id));

  return c.json({ success: true });
});
