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
npx wrangler d1 migrations apply vela-db --local   # Local
npx wrangler d1 migrations apply vela-db           # Remote
```

## Architecture

**Monorepo Structure:**
- `apps/api` - Hono REST API on Cloudflare Workers (scans URLs, identifies scripts)
- `apps/web` - Astro frontend on Cloudflare Pages (scan form, results dashboard)
- `packages/shared` - TypeScript types shared across all packages
- `packages/script-db` - Third-party script pattern database and matching utilities
- `packages/typescript-config` - Shared tsconfig presets (base, worker, astro, library)
- `migrations/` - D1 database migrations

**Dependency Flow:**
```
apps/api ──→ @vela/script-db ──→ @vela/shared
apps/web ──────────────────────→ @vela/shared
```

**Tech Stack:**
- Turborepo + pnpm workspaces for monorepo management
- Hono for API routes (lightweight, edge-compatible)
- Astro + Tailwind for frontend
- Cloudflare D1 (SQLite) for persistence
- Cloudflare KV for caching and rate limiting
- Cloudflare Browser Rendering (Puppeteer) for page scanning

## Key Files

- `apps/api/src/index.ts` - API entry point with Hono middleware setup
- `apps/api/src/routes/scans.ts` - POST /scans, GET /scans/:id endpoints
- `apps/api/src/services/scan.ts` - Scan orchestration and script analysis
- `apps/api/src/services/browser.ts` - Puppeteer browser automation
- `apps/web/src/pages/index.astro` - Homepage with scan form
- `apps/web/src/pages/scan/[id].astro` - Scan results page
- `packages/script-db/src/matcher.ts` - URL pattern matching for script identification
- `packages/shared/src/types/` - All shared TypeScript types

## Cloudflare Bindings

The API worker (`apps/api/wrangler.jsonc`) uses:
- `DB` - D1 database for scans and known scripts
- `SCAN_CACHE` - KV namespace for result caching
- `RATE_LIMIT` - KV namespace for rate limiting
- `BROWSER` - Browser Rendering binding for Puppeteer

## Type System

All types are in `packages/shared/src/types/`:
- `script.ts` - ScriptCategory, ThirdPartyScript, KnownScript
- `performance.ts` - ScriptPerformanceProfile, NetworkRequest
- `privacy.ts` - PrivacyProfile, CookieInfo, FingerprintTechnique
- `scan.ts` - ScanResult, ScanStatus, Grade, Issue

Import with: `import type { ScanResult, ThirdPartyScript } from "@vela/shared"`

## TypeScript Configs

Extend the appropriate preset in each package's tsconfig.json:
- `@vela/typescript-config/worker.json` - For Cloudflare Workers
- `@vela/typescript-config/astro.json` - For Astro apps
- `@vela/typescript-config/library.json` - For shared packages
