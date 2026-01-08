#!/usr/bin/env tsx
/**
 * CLI script for managing script patterns in D1 database
 *
 * Usage:
 *   pnpm patterns list [--category <cat>] [--local]
 *   pnpm patterns get <id> [--local]
 *   pnpm patterns add --id <id> --name <name> --vendor <vendor> --category <cat> --url-patterns <patterns> [--local]
 *   pnpm patterns delete <id> [--local]
 *   pnpm patterns export [--output <file>] [--local]
 *   pnpm patterns import --file <file> [--local]
 *   pnpm patterns seed [--local]
 *
 * Note: Uses wrangler d1 execute under the hood
 */

import { Command } from "commander";
import { execSync } from "child_process";

const program = new Command();

function runD1Query(sql: string, isLocal: boolean): string {
  const localFlag = isLocal ? "--local" : "";
  const escapedSql = sql.replace(/'/g, "'\\''");
  const cmd = `npx wrangler d1 execute vela-db ${localFlag} --command '${escapedSql}' --json`;

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

function parseD1Result(output: string): unknown[] {
  try {
    const parsed = JSON.parse(output);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].results) {
      return parsed[0].results;
    }
    return [];
  } catch {
    console.error("Failed to parse D1 output:", output);
    return [];
  }
}

program
  .name("patterns")
  .description("Manage script patterns in D1 database")
  .version("1.0.0");

program
  .command("list")
  .description("List all patterns")
  .option("-c, --category <category>", "Filter by category")
  .option("-v, --vendor <vendor>", "Filter by vendor")
  .option("-l, --local", "Use local D1 database", true)
  .action((options) => {
    let sql = "SELECT id, name, vendor, category, is_active FROM known_scripts";
    const conditions: string[] = [];

    if (options.category) {
      conditions.push(`category = '${options.category}'`);
    }
    if (options.vendor) {
      conditions.push(`vendor = '${options.vendor}'`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += " ORDER BY vendor, name";

    const result = runD1Query(sql, options.local);
    const patterns = parseD1Result(result);

    if (patterns.length === 0) {
      console.log("No patterns found.");
      return;
    }

    console.log(`\nFound ${patterns.length} patterns:\n`);
    console.log("ID".padEnd(30) + "Name".padEnd(30) + "Vendor".padEnd(20) + "Category".padEnd(20) + "Active");
    console.log("-".repeat(110));

    for (const p of patterns as Array<{ id: string; name: string; vendor: string; category: string; is_active: number }>) {
      console.log(
        p.id.padEnd(30) +
        p.name.substring(0, 28).padEnd(30) +
        p.vendor.padEnd(20) +
        p.category.padEnd(20) +
        (p.is_active ? "Yes" : "No")
      );
    }
  });

program
  .command("get <id>")
  .description("Get a specific pattern by ID")
  .option("-l, --local", "Use local D1 database", true)
  .action((id, options) => {
    const sql = `SELECT * FROM known_scripts WHERE id = '${id}'`;
    const result = runD1Query(sql, options.local);
    const patterns = parseD1Result(result);

    if (patterns.length === 0) {
      console.log(`Pattern with ID "${id}" not found.`);
      return;
    }

    const p = patterns[0] as Record<string, unknown>;
    console.log("\nPattern details:");
    console.log(JSON.stringify(p, null, 2));
  });

program
  .command("add")
  .description("Add a new pattern")
  .requiredOption("--id <id>", "Unique pattern ID")
  .requiredOption("--name <name>", "Display name")
  .requiredOption("--vendor <vendor>", "Vendor name")
  .requiredOption("--category <category>", "Category (analytics, advertising, etc.)")
  .requiredOption("--url-patterns <patterns>", "Comma-separated URL patterns")
  .option("--global-vars <vars>", "Comma-separated global variables")
  .option("--issues <issues>", "Comma-separated known issues")
  .option("--alternatives <alts>", "Comma-separated alternatives")
  .option("--docs-url <url>", "Documentation URL")
  .option("-l, --local", "Use local D1 database", true)
  .action((options) => {
    const urlPatterns = JSON.stringify(options.urlPatterns.split(",").map((s: string) => s.trim()));
    const globalVars = options.globalVars ? JSON.stringify(options.globalVars.split(",").map((s: string) => s.trim())) : "[]";
    const issues = options.issues ? JSON.stringify(options.issues.split(",").map((s: string) => s.trim())) : "[]";
    const alternatives = options.alternatives ? JSON.stringify(options.alternatives.split(",").map((s: string) => s.trim())) : "[]";
    const docsUrl = options.docsUrl ? `'${options.docsUrl}'` : "NULL";

    const sql = `
      INSERT INTO known_scripts (id, name, vendor, category, url_patterns, global_variables, known_issues, alternatives, docs_url, is_active, created_at, updated_at)
      VALUES (
        '${options.id}',
        '${options.name}',
        '${options.vendor}',
        '${options.category}',
        '${urlPatterns}',
        '${globalVars}',
        '${issues}',
        '${alternatives}',
        ${docsUrl},
        1,
        strftime('%s', 'now') * 1000,
        strftime('%s', 'now') * 1000
      )
    `.trim();

    runD1Query(sql, options.local);
    console.log(`Pattern "${options.id}" added successfully.`);
  });

program
  .command("delete <id>")
  .description("Soft-delete a pattern (set is_active = 0)")
  .option("-l, --local", "Use local D1 database", true)
  .option("--hard", "Permanently delete the pattern")
  .action((id, options) => {
    let sql: string;
    if (options.hard) {
      sql = `DELETE FROM known_scripts WHERE id = '${id}'`;
    } else {
      sql = `UPDATE known_scripts SET is_active = 0, updated_at = strftime('%s', 'now') * 1000 WHERE id = '${id}'`;
    }

    runD1Query(sql, options.local);
    console.log(`Pattern "${id}" ${options.hard ? "permanently deleted" : "deactivated"}.`);
  });

program
  .command("export")
  .description("Export all patterns to JSON")
  .option("-o, --output <file>", "Output file path", "patterns-export.json")
  .option("-l, --local", "Use local D1 database", true)
  .action((options) => {
    const sql = "SELECT * FROM known_scripts WHERE is_active = 1";
    const result = runD1Query(sql, options.local);
    const patterns = parseD1Result(result);

    const fs = require("fs");
    fs.writeFileSync(options.output, JSON.stringify(patterns, null, 2));
    console.log(`Exported ${patterns.length} patterns to ${options.output}`);
  });

program
  .command("import")
  .description("Import patterns from JSON file")
  .requiredOption("-f, --file <file>", "Input file path")
  .option("-l, --local", "Use local D1 database", true)
  .action((options) => {
    const fs = require("fs");
    const content = fs.readFileSync(options.file, "utf-8");
    const patterns = JSON.parse(content) as Array<{
      id: string;
      name: string;
      vendor: string;
      category: string;
      url_patterns: string;
      global_variables?: string;
      known_issues?: string;
      alternatives?: string;
      docs_url?: string;
    }>;

    let imported = 0;
    for (const p of patterns) {
      const sql = `
        INSERT OR REPLACE INTO known_scripts (id, name, vendor, category, url_patterns, global_variables, known_issues, alternatives, docs_url, is_active, created_at, updated_at)
        VALUES (
          '${p.id}',
          '${p.name.replace(/'/g, "''")}',
          '${p.vendor.replace(/'/g, "''")}',
          '${p.category}',
          '${typeof p.url_patterns === "string" ? p.url_patterns : JSON.stringify(p.url_patterns)}',
          '${p.global_variables || "[]"}',
          '${p.known_issues || "[]"}',
          '${p.alternatives || "[]"}',
          ${p.docs_url ? `'${p.docs_url}'` : "NULL"},
          1,
          strftime('%s', 'now') * 1000,
          strftime('%s', 'now') * 1000
        )
      `.trim();

      try {
        runD1Query(sql, options.local);
        imported++;
      } catch (err) {
        console.error(`Failed to import pattern "${p.id}":`, err);
      }
    }

    console.log(`Imported ${imported}/${patterns.length} patterns.`);
  });

program
  .command("seed")
  .description("Seed database with test patterns (Google Analytics and Facebook Pixel)")
  .option("-l, --local", "Use local D1 database", true)
  .action((options) => {
    const localFlag = options.local ? "--local" : "";
    const cmd = `npx wrangler d1 execute vela-db ${localFlag} --file=scripts/seed-patterns.sql`;

    try {
      execSync(cmd, { encoding: "utf-8", stdio: "inherit", cwd: process.cwd() });
      console.log("\nSeeded 2 test patterns (Google Analytics 4, Facebook Pixel).");
    } catch (error) {
      console.error("Failed to seed patterns:", error);
      process.exit(1);
    }
  });

program.parse();
