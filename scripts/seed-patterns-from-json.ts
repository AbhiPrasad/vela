#!/usr/bin/env tsx
/**
 * CLI script for seeding script patterns from JSON files
 *
 * Usage:
 *   pnpm patterns:seed-json [--local] [--dry-run]
 *
 * Reads all JSON files from scripts/patterns/ directory and inserts them into the database.
 */

import { Command } from "commander";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Valid categories - must match ScriptCategory in packages/shared/src/types/script.ts
const VALID_CATEGORIES = new Set([
  "analytics",
  "advertising",
  "social",
  "customer-support",
  "chat",
  "ab-testing",
  "cdn",
  "cdp",
  "tag-manager",
  "video",
  "fonts",
  "session-recording",
  "error-tracking",
  "consent",
  "payment",
  "performance",
  "marketing",
  "push",
  "survey",
  "ecommerce",
  "maps",
  "security",
  "other",
]);

interface PatternJson {
  id: string;
  name: string;
  vendor: string;
  category: string;
  url_patterns: string[];
  global_variables: string[];
  known_issues: string[];
  alternatives: string[];
  docs_url: string;
  is_active: boolean;
}

function normalizeCategory(category: string): string {
  if (VALID_CATEGORIES.has(category)) {
    return category;
  }
  console.warn(`  Unknown category "${category}", defaulting to "other"`);
  return "other";
}

const program = new Command();

function runD1Query(sql: string, isLocal: boolean): string {
  const localFlag = isLocal ? "--local" : "";
  const escapedSql = sql.replace(/'/g, "'\\''");
  const cmd = `npx wrangler d1 execute vela-db ${localFlag} -c apps/api/wrangler.jsonc --command '${escapedSql}' --json`;

  try {
    const result = execSync(cmd, { encoding: "utf-8", cwd: process.cwd() });
    return result;
  } catch (error) {
    if (error instanceof Error && "stdout" in error) {
      return (error as { stdout: string }).stdout;
    }
    throw error;
  }
}

function escapeString(str: string): string {
  return str.replace(/'/g, "''");
}

function getAllPatternFiles(dir: string): string[] {
  const files: string[] = [];

  function walkDir(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(fullPath);
      }
    }
  }

  walkDir(dir);
  return files;
}

function readPatternFile(filePath: string): PatternJson | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as PatternJson;
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error);
    return null;
  }
}

program
  .name("seed-patterns-from-json")
  .description("Seed database with patterns from JSON files")
  .option("-l, --local", "Use local D1 database", true)
  .option("-d, --dry-run", "Print SQL without executing", false)
  .option("-c, --category <category>", "Only seed patterns from a specific category")
  .action((options) => {
    const patternsDir = path.join(process.cwd(), "scripts", "patterns");

    if (!fs.existsSync(patternsDir)) {
      console.error(`Patterns directory not found: ${patternsDir}`);
      process.exit(1);
    }

    let patternFiles = getAllPatternFiles(patternsDir);

    if (options.category) {
      const categoryDir = path.join(patternsDir, options.category);
      if (fs.existsSync(categoryDir)) {
        patternFiles = patternFiles.filter((f) => f.startsWith(categoryDir));
      } else {
        console.error(`Category directory not found: ${categoryDir}`);
        process.exit(1);
      }
    }

    console.log(`Found ${patternFiles.length} pattern files to process...\n`);

    let successCount = 0;
    let errorCount = 0;
    const categories = new Map<string, number>();

    for (const filePath of patternFiles) {
      const pattern = readPatternFile(filePath);
      if (!pattern) {
        errorCount++;
        continue;
      }

      // Normalize category (default to "other" if unknown)
      const category = normalizeCategory(pattern.category);

      // Track categories
      const count = categories.get(category) || 0;
      categories.set(category, count + 1);

      const sql = `
        INSERT OR REPLACE INTO known_scripts (
          id, name, vendor, category, url_patterns, global_variables,
          known_issues, alternatives, docs_url, is_active, created_at, updated_at
        ) VALUES (
          '${escapeString(pattern.id)}',
          '${escapeString(pattern.name)}',
          '${escapeString(pattern.vendor)}',
          '${escapeString(category)}',
          '${escapeString(JSON.stringify(pattern.url_patterns))}',
          '${escapeString(JSON.stringify(pattern.global_variables))}',
          '${escapeString(JSON.stringify(pattern.known_issues))}',
          '${escapeString(JSON.stringify(pattern.alternatives))}',
          ${pattern.docs_url ? `'${escapeString(pattern.docs_url)}'` : "NULL"},
          ${pattern.is_active !== false ? 1 : 0},
          strftime('%s', 'now') * 1000,
          strftime('%s', 'now') * 1000
        )
      `.trim();

      if (options.dryRun) {
        console.log(`[DRY RUN] Would insert: ${pattern.id} (${pattern.name})`);
      } else {
        try {
          runD1Query(sql, options.local);
          successCount++;
          process.stdout.write(`\r  Inserted ${successCount} patterns...`);
        } catch (error) {
          console.error(`\nFailed to insert pattern "${pattern.id}":`, error);
          errorCount++;
        }
      }
    }

    console.log(`\n\nSeeding complete!`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`\nPatterns by category:`);

    const sortedCategories = Array.from(categories.entries()).sort((a, b) => b[1] - a[1]);
    for (const [category, count] of sortedCategories) {
      console.log(`  ${category}: ${count}`);
    }
  });

program.parse();
