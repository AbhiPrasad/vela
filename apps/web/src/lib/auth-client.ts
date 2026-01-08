import { createAuthClient } from "better-auth/client";

const API_URL = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8787";

export const authClient = createAuthClient({
  baseURL: API_URL,
});

export type Session = typeof authClient.$Infer.Session;
export type User = Session["user"];
