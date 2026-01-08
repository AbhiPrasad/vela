# Third-Party Script Auditor - Project Plan

A web tool that analyzes third-party scripts on any website, showing their performance cost, data collection behavior, and known issues.

## Problem Statement

Third-party scripts (analytics, ads, chat widgets, A/B testing) are a major source of performance problems, yet developers often have no visibility into their true cost. Adding a "simple" script tag can block the main thread for seconds, send data to dozens of endpoints, and introduce security vulnerabilities.

## Goals

- Provide instant visibility into third-party script costs on any URL
- Identify scripts that block rendering or degrade Core Web Vitals
- Surface data collection and privacy concerns
- Offer actionable recommendations for each problematic script
- Build a community database of known third-party script behaviors

## Target Users

- Frontend developers auditing site performance
- Privacy-conscious teams evaluating vendor scripts
- Security engineers assessing third-party risk
- Marketing teams understanding the cost of their tools

## Core Features

### Phase 1: MVP

1. **URL Scanner**
   - Enter any URL to analyze
   - Headless browser loads page and captures all activity
   - Returns comprehensive third-party analysis

2. **Script Identification**
   - Detect and categorize all third-party scripts
   - Categories: Analytics, Advertising, Social, Customer Support, A/B Testing, CDN, Other
   - Match against known script database (similar to Wappalyzer)

3. **Performance Metrics per Script**
   - JavaScript execution time (main thread blocking)
   - Network requests initiated
   - Total bytes transferred
   - Impact on Core Web Vitals (LCP, CLS, INP attribution)

4. **Summary Dashboard**
   - Total third-party count and categories
   - Aggregate performance cost
   - Top offenders ranked by impact
   - Overall score (A-F grade)

### Phase 2: Deep Analysis

5. **Network Activity Map**
   - Visualize all endpoints each script contacts
   - Show data flow (what's being sent where)
   - Flag cross-border data transfers
   - Identify fourth-party requests (scripts loading other scripts)

6. **Privacy Analysis**
   - Cookies set by each script
   - LocalStorage/SessionStorage usage
   - Fingerprinting technique detection
   - PII detection in outbound requests

7. **Script Behavior Profiling**
   - DOM modifications made
   - Event listeners attached
   - Global variables polluted
   - Prototype modifications (monkey-patching)

### Phase 3: Community & Automation

8. **Known Script Database**
   - Community-contributed script profiles
   - Known issues and CVEs
   - Recommended alternatives
   - Historical performance trends

9. **Comparison Mode**
   - Compare your site against competitors
   - Before/after optimization comparison
   - Track changes over time

10. **CI Integration**
    - GitHub Action for automated audits
    - Fail builds if third-party budget exceeded
    - PR comments with script impact

11. **API Access**
    - Programmatic access to auditor
    - Webhook notifications for changes
    - Integration with monitoring tools

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Frontend                            │
│  - URL input form                                           │
│  - Results dashboard                                        │
│  - Interactive visualizations                               │
│  (Astro + Cloudflare Workers)                               │
├─────────────────────────────────────────────────────────────┤
│                      API Layer                               │
│  - Job queue management                                     │
│  - Results caching                                          │
│  - Rate limiting                                            │
│  (Hono + Cloudflare Workers)                                │
├─────────────────────────────────────────────────────────────┤
│                    Analysis Engine                           │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐      │
│  │  Cloudflare │  │  CDP Session │  │  Script       │      │
│  │  Browser    │  │  (Network,   │  │  Identifier   │      │
│  │  Rendering  │  │   Coverage,  │  │  (pattern     │      │
│  │  (Puppeteer)│  │   Profiler)  │  │   matching)   │      │
│  └─────────────┘  └──────────────┘  └───────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                                │
│  - Script fingerprint database                              │
│  - Scan results cache                                       │
│  - Historical data                                          │
│  (Cloudflare D1 + KV)                                       │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Monorepo**: Turborepo with pnpm workspaces
- **Frontend**: Astro with @astrojs/cloudflare adapter, TypeScript
- **Styling**: Tailwind CSS
- **Visualizations**: D3.js for network graphs, custom charts
- **Backend**: Hono (lightweight, edge-compatible) on Cloudflare Workers
- **Browser Automation**: Cloudflare Browser Rendering (@cloudflare/puppeteer)
- **Database**: Cloudflare D1 (SQLite), Cloudflare KV (cache)
- **Hosting**: Cloudflare Workers (both frontend and API)

## Key Technical Approaches

### Script Detection

```typescript
interface ThirdPartyScript {
  url: string;
  category: ScriptCategory;
  vendor: string | null;
  fingerprint: string; // hash of script content
  confidence: number;
}

// Detection methods:
// 1. URL pattern matching (e.g., google-analytics.com)
// 2. Script content fingerprinting
// 3. Global variable detection (e.g., window.ga)
// 4. Network request patterns
```

### Performance Attribution

```typescript
interface ScriptPerformanceProfile {
  scriptUrl: string;
  metrics: {
    mainThreadTime: number;      // ms of main thread blocking
    networkRequests: number;     // total requests initiated
    bytesTransferred: number;    // total bytes
    domMutations: number;        // DOM changes made
    longTasks: number;           // 50ms+ tasks attributed
  };
  webVitalsImpact: {
    lcpDelta: number | null;     // estimated LCP impact
    clsDelta: number | null;     // estimated CLS impact
    inpDelta: number | null;     // estimated INP impact
  };
}
```

### Privacy Analysis

```typescript
interface PrivacyProfile {
  cookies: CookieInfo[];
  localStorage: StorageEntry[];
  sessionStorage: StorageEntry[];
  outboundData: {
    endpoint: string;
    dataTypes: DataType[];  // 'ip', 'useragent', 'custom_id', etc.
    crossBorder: boolean;
  }[];
  fingerprintingSignals: FingerprintTechnique[];
}

type FingerprintTechnique =
  | 'canvas'
  | 'webgl'
  | 'audio'
  | 'fonts'
  | 'screen'
  | 'plugins';
```

## Data Model

```typescript
interface ScanResult {
  id: string;
  url: string;
  timestamp: Date;
  duration: number;

  scripts: ThirdPartyScript[];
  performance: ScriptPerformanceProfile[];
  privacy: PrivacyProfile[];

  summary: {
    totalScripts: number;
    totalRequests: number;
    totalBytes: number;
    totalMainThreadTime: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    topIssues: Issue[];
  };
}

interface KnownScript {
  id: string;
  name: string;
  vendor: string;
  category: ScriptCategory;
  urlPatterns: string[];
  contentFingerprints: string[];
  globalVariables: string[];
  knownIssues: string[];
  alternatives: string[];
  avgMainThreadTime: number;
  communityRating: number;
}
```

## Scoring Algorithm

```
Grade = weighted average of:
  - Main thread blocking time (30%)
    A: <500ms, B: <1s, C: <2s, D: <3s, F: >3s

  - Number of fourth-parties (20%)
    A: 0, B: 1-2, C: 3-5, D: 6-10, F: >10

  - Total transfer size (20%)
    A: <200KB, B: <500KB, C: <1MB, D: <2MB, F: >2MB

  - Privacy concerns (15%)
    Deductions for fingerprinting, excessive cookies, PII leaks

  - Known issues (15%)
    Deductions for scripts with documented problems
```

## Monorepo Structure

```
vela/
├── apps/
│   ├── web/                    # Astro frontend
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── layouts/
│   │   ├── astro.config.mjs
│   │   ├── wrangler.jsonc
│   │   └── package.json
│   └── api/                    # Hono API worker
│       ├── src/
│       │   ├── index.ts
│       │   ├── routes/
│       │   └── services/
│       ├── wrangler.jsonc
│       └── package.json
├── packages/
│   ├── shared/                 # Shared types & utils
│   ├── scanner/                # Browser scanning logic
│   ├── script-db/              # Third-party script patterns
│   ├── eslint-config/          # Shared ESLint config
│   └── typescript-config/      # Shared TS config
├── migrations/                 # D1 database migrations
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .nvmrc
```

## Implementation Steps

### Step 1: Initialize Monorepo
- Create root package.json with Turborepo
- Set up pnpm workspaces
- Configure turbo.json task pipeline
- Create shared TypeScript and ESLint configs

### Step 2: Create Shared Packages
- `packages/shared` - Core types (ScanResult, ThirdPartyScript, etc.)
- `packages/scanner` - Browser automation with Cloudflare Browser Rendering
- `packages/script-db` - URL patterns for 100+ common third-party scripts

### Step 3: Build API Worker
- Set up Hono with Cloudflare Workers
- Create routes: POST /scans, GET /scans/:id, GET /scripts
- Integrate Browser Rendering for page scanning
- Connect to D1 database and KV cache

### Step 4: Build Frontend
- Set up Astro with Cloudflare adapter
- Create URL input form and scan submission
- Build results dashboard with script cards
- Add A-F grade visualization

### Step 5: Performance Attribution
- Use CDP Profiler for main thread time
- Attribute long tasks to initiating scripts
- Calculate per-script metrics
- Implement scoring algorithm

### Step 6: Privacy Analysis
- Capture cookies and storage access
- Monitor outbound request payloads
- Detect fingerprinting techniques
- Flag privacy concerns

### Step 7: Community Features
- Add user accounts (optional)
- Enable script database contributions
- Implement voting/rating system
- Build comparison features

### Step 8: CI/API
- Create GitHub Action
- Build public API with rate limiting
- Add webhook notifications
- Write documentation

## Success Metrics

- Scan completes in under 60 seconds for typical pages
- Script identification accuracy above 90% for top 500 scripts
- User satisfaction: audits surface at least 2 actionable issues
- Community growth: 100+ script profiles contributed in first 6 months

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Sites blocking headless browsers | Use stealth plugins, rotate user agents |
| Scan cost/resource usage | Implement caching, rate limiting, job queues |
| Script database maintenance | Community contributions, automated fingerprinting |
| Privacy concerns about scanning | Clear ToS, don't store sensitive data, robots.txt respect |
| Dynamic scripts (loaded conditionally) | Multiple scan passes, interaction simulation |

## Comparable Tools

- **WebPageTest** - General performance, less third-party focus
- **Lighthouse** - Audits but doesn't deep-dive third-parties
- **Blacklight (The Markup)** - Privacy focused, less performance data
- **BuiltWith/Wappalyzer** - Detection only, no performance analysis

This tool combines the best of all: detection + performance + privacy in one.

## Future Ideas

- Browser extension for real-time analysis
- Slack/Discord bot for quick audits
- Third-party script CDN (privacy-respecting proxied versions)
- Automated third-party update monitoring
- ML-based script behavior classification

---

## Cloudflare Resource Limits

| Resource | Free Tier | Paid Tier |
|----------|-----------|-----------|
| Concurrent browsers | 3 | 30 |
| Daily browser time | 10 min | Unlimited |
| Browser timeout | 60s (10min max) | 60s (10min max) |
| New browsers/min | 3 | 30 |

**Mitigations:**
- Cache results in KV (24h TTL)
- Deduplicate scans for same URL
- Queue requests when at capacity

## Cloudflare Setup Commands

Run these before first deployment:

```bash
# 1. Login to Cloudflare
npx wrangler login

# 2. Create D1 database
npx wrangler d1 create vela-db
# Copy the database_id to wrangler.jsonc files

# 3. Create KV namespaces
npx wrangler kv namespace create SCAN_CACHE
npx wrangler kv namespace create RATE_LIMIT
# Copy the IDs to wrangler.jsonc files

# 4. Run D1 migrations (after creating migrations/)
npx wrangler d1 migrations apply vela-db --local  # Test locally first
npx wrangler d1 migrations apply vela-db          # Apply to remote

# 5. Browser Rendering is automatically available
# Just add the browser binding to wrangler.jsonc:
# "browser": { "binding": "BROWSER" }
```

## D1 Database Schema

```sql
CREATE TABLE scans (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  grade TEXT,
  total_scripts INTEGER,
  total_bytes INTEGER,
  error_message TEXT
);

CREATE TABLE scan_scripts (
  id TEXT PRIMARY KEY,
  scan_id TEXT REFERENCES scans(id),
  url TEXT NOT NULL,
  category TEXT,
  vendor TEXT,
  size_bytes INTEGER,
  main_thread_time_ms INTEGER
);

CREATE TABLE known_scripts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  category TEXT NOT NULL,
  url_patterns TEXT NOT NULL
);
```

## Browser Scanning Pattern

```typescript
import puppeteer from '@cloudflare/puppeteer';

export async function scanUrl(env: Env, url: string) {
  const browser = await puppeteer.launch(env.BROWSER);
  const page = await browser.newPage();

  const requests: NetworkRequest[] = [];
  await page.setRequestInterception(true);

  page.on('request', req => {
    requests.push({ url: req.url(), type: req.resourceType() });
    req.continue();
  });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  const metrics = await page.metrics();

  await browser.close();
  return { requests, metrics };
}
```

