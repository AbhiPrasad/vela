import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema.js";
import type { Env } from "../types.js";

export function createAuth(env: Env) {
  const db = drizzle(env.DB, { schema });

  // Build trusted origins list
  const trustedOrigins: string[] = [];
  // In development, trust common localhost ports
  if (env.ENVIRONMENT === "development") {
    trustedOrigins.push(
      "http://localhost:4321",
      "http://localhost:4322",
      "http://localhost:4323",
      "http://localhost:8787"
    );
  }
  // Always trust explicitly configured origins
  if (env.WEB_URL) {
    trustedOrigins.push(env.WEB_URL);
  }
  if (env.BETTER_AUTH_URL) {
    trustedOrigins.push(env.BETTER_AUTH_URL);
  }

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      usePlural: true,
    }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: false,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
