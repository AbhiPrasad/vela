# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vela is a third-party script auditor that analyzes websites to identify tracking scripts, their performance impact, and privacy concerns. It runs entirely on Cloudflare's edge platform.

## Commands

```bash
# Development
pnpm dev              # Start all apps in dev mode (Astro + Wrangler)
pnpm build            # Build all packages and apps
pnpm typecheck        # Type check entire monorepo
pnpm lint             # Lint with oxlint
pnpm format           # Format with Prettier

# Per-app commands (run from app directory)
cd apps/api && pnpm dev       # API worker only
cd apps/web && pnpm dev       # Web frontend only
cd apps/api && pnpm deploy    # Deploy API to Cloudflare Workers
cd apps/web && pnpm deploy    # Deploy web to Cloudflare Pages

# Database migrations
pnpm db:migrate:local         # Apply migrations locally
pnpm db:migrate:remote        # Apply migrations to production

# Pattern management CLI
pnpm patterns list [--category <cat>]    # List patterns
pnpm patterns get <id>                   # Get pattern by ID
pnpm patterns add --id <id> ...          # Add new pattern
pnpm patterns seed                       # Seed test patterns (GA4, Facebook Pixel)
pnpm patterns export                     # Export patterns to JSON
pnpm patterns import --file <file>       # Import patterns from JSON
```

## Architecture

**Monorepo Structure:**
- `apps/api` - Hono REST API on Cloudflare Workers (scans URLs, identifies scripts, auth, admin)
- `apps/web` - Astro frontend on Cloudflare Pages (scan form, results, admin panel)
- `packages/shared` - TypeScript types shared across all packages
- `packages/script-db` - Static script patterns (legacy, being replaced by D1)
- `packages/typescript-config` - Shared tsconfig presets (base, worker, astro, library)
- `migrations/` - D1 database migrations
- `scripts/` - CLI tools for pattern management

**Dependency Flow:**
```
apps/api ──→ drizzle-orm, better-auth ──→ @vela/shared
apps/web ──→ better-auth/client ────────→ @vela/shared
```

**Tech Stack:**
- Turborepo + pnpm workspaces for monorepo management
- Hono for API routes (lightweight, edge-compatible)
- Astro + Tailwind for frontend
- Cloudflare D1 (SQLite) for persistence
- Cloudflare KV for caching and rate limiting
- Cloudflare Browser Rendering (Puppeteer) for page scanning
- Drizzle ORM for type-safe database queries
- better-auth for authentication (email/password + GitHub OAuth)

## Key Files

### API (apps/api/src/)
- `index.ts` - API entry point with Hono middleware, mounts all routers
- `db/schema.ts` - Drizzle schema (users, sessions, accounts, scans, knownScripts)
- `db/index.ts` - Database client factory
- `lib/auth.ts` - better-auth configuration
- `middleware/auth.ts` - Auth middleware (requireAuth, requireRole, requireAdmin, requireEditor)
- `services/scan.ts` - Scan orchestration and script analysis
- `services/pattern.ts` - PatternService for D1-backed script matching
- `services/browser.ts` - Puppeteer browser automation
- `utils/url.ts` - URL utilities (isFirstParty, extractDomain, patternToRegex)
- `routes/scans.ts` - POST /scans, GET /scans/:id endpoints
- `routes/scripts.ts` - GET /scripts, POST /scripts/identify endpoints
- `routes/auth.ts` - Auth routes at /api/auth/*
- `routes/admin/patterns.ts` - Admin pattern CRUD (editor + admin)
- `routes/admin/users.ts` - Admin user management (admin only)

### Web (apps/web/src/)
- `lib/auth-client.ts` - better-auth client for frontend
- `middleware.ts` - Astro middleware for route protection
- `layouts/BaseLayout.astro` - Public layout with auth-aware nav
- `layouts/AdminLayout.astro` - Admin panel layout with sidebar
- `pages/auth/login.astro` - Login page (email + GitHub OAuth)
- `pages/auth/signup.astro` - Registration page
- `pages/admin/index.astro` - Admin dashboard
- `pages/admin/patterns/` - Pattern list, add, edit pages
- `pages/admin/users/` - User management (admin only)

### Database
- `migrations/0001_create_tables.sql` - Initial schema (scans, scan_scripts, known_scripts)
- `migrations/0002_auth_and_patterns.sql` - Auth tables and pattern extensions

## Cloudflare Bindings

The API worker (`apps/api/wrangler.jsonc`) uses:
- `DB` - D1 database for scans, known scripts, and auth
- `SCAN_CACHE` - KV namespace for result caching
- `RATE_LIMIT` - KV namespace for rate limiting
- `BROWSER` - Browser Rendering binding for Puppeteer

**Required Secrets (set via `wrangler secret put`):**
- `BETTER_AUTH_SECRET` - Auth encryption key (generate with `openssl rand -base64 32`)
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID (optional)
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret (optional)

## Authentication & Authorization

**Roles:**
- `user` - Default role, no admin access
- `editor` - Can manage script patterns (CRUD)
- `admin` - Full access including user management

**Protected Routes:**
- `/admin/*` - Requires editor or admin role
- `/admin/users/*` - Requires admin role only

**API Endpoints:**
- `POST /api/auth/sign-up/email` - Register with email/password
- `POST /api/auth/sign-in/email` - Login with email/password
- `GET /api/auth/sign-in/social?provider=github` - GitHub OAuth
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/get-session` - Get current session

## Type System

All types are in `packages/shared/src/types/`:
- `script.ts` - ScriptCategory, ThirdPartyScript, KnownScript
- `performance.ts` - ScriptPerformanceProfile, NetworkRequest
- `privacy.ts` - PrivacyProfile, CookieInfo, FingerprintTechnique
- `scan.ts` - ScanResult, ScanStatus, Grade, Issue

Drizzle types in `apps/api/src/db/schema.ts`:
- User, Session, Account, Scan, ScanScript, KnownScript

Import with: `import type { ScanResult, ThirdPartyScript } from "@vela/shared"`

## TypeScript Configs

Extend the appropriate preset in each package's tsconfig.json:
- `@vela/typescript-config/worker.json` - For Cloudflare Workers
- `@vela/typescript-config/astro.json` - For Astro apps
- `@vela/typescript-config/library.json` - For shared packages
