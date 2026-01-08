# Vela

A third-party script auditor that analyzes websites to identify tracking scripts, their performance impact, and privacy concerns. Runs entirely on Cloudflare's edge platform.

## Features

- Scan websites for third-party scripts
- Identify script vendors and purposes (analytics, ads, social, etc.)
- Analyze performance impact of each script
- Detect privacy concerns (cookies, fingerprinting, data collection)
- Grade overall script health

## Tech Stack

- **Runtime**: Cloudflare Workers + Pages
- **API**: [Hono](https://hono.dev/) (lightweight, edge-compatible)
- **Frontend**: [Astro](https://astro.build/) + Tailwind CSS
- **Database**: Cloudflare D1 (SQLite)
- **Caching**: Cloudflare KV
- **Browser Automation**: Cloudflare Browser Rendering (Puppeteer)
- **Monorepo**: [Turborepo](https://turbo.build/) + pnpm workspaces

## Project Structure

```
vela/
├── apps/
│   ├── api/          # Hono REST API (Cloudflare Workers)
│   └── web/          # Astro frontend (Cloudflare Pages)
├── packages/
│   ├── shared/       # Shared TypeScript types
│   ├── script-db/    # Script pattern database & matching
│   └── typescript-config/  # Shared tsconfig presets
└── migrations/       # D1 database migrations
```

## Prerequisites

- Node.js >= 20
- pnpm 9.x

## Getting Started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Set up local database**

   ```bash
   npx wrangler d1 migrations apply vela-db --local
   ```

3. **Start development servers**

   ```bash
   pnpm dev
   ```

   This starts both the API worker and web frontend in development mode.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | Type check entire monorepo |
| `pnpm lint` | Lint with oxlint |
| `pnpm format` | Format with Prettier |

### Per-App Commands

```bash
# API (Cloudflare Workers)
cd apps/api
pnpm dev        # Start API worker
pnpm deploy     # Deploy to Cloudflare Workers

# Web (Cloudflare Pages)
cd apps/web
pnpm dev        # Start Astro dev server
pnpm deploy     # Deploy to Cloudflare Pages
```

### Database Migrations

```bash
# Apply migrations locally
npx wrangler d1 migrations apply vela-db --local

# Apply migrations to production
npx wrangler d1 migrations apply vela-db
```

## Architecture

### Dependency Flow

```
apps/api ──→ @vela/script-db ──→ @vela/shared
apps/web ──────────────────────→ @vela/shared
```

### Cloudflare Bindings

The API worker uses the following Cloudflare bindings:

- `DB` - D1 database for scans and known scripts
- `SCAN_CACHE` - KV namespace for result caching
- `RATE_LIMIT` - KV namespace for rate limiting
- `BROWSER` - Browser Rendering binding for Puppeteer

## License

MIT
