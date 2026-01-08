/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly API_URL: string;
  readonly PUBLIC_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend Astro locals with auth data
declare namespace App {
  interface Locals {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: "user" | "editor" | "admin";
      image: string | null;
    } | null;
    session: {
      id: string;
      userId: string;
      token: string;
      expiresAt: Date;
    } | null;
  }
}
