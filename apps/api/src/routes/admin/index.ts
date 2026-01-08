import { Hono } from "hono";
import type { Env, Variables } from "../../types.js";
import { adminPatternsRouter } from "./patterns.js";
import { adminUsersRouter } from "./users.js";

export const adminRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

adminRouter.route("/patterns", adminPatternsRouter);
adminRouter.route("/users", adminUsersRouter);
