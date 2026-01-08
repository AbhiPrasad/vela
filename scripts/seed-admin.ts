#!/usr/bin/env tsx
/**
 * CLI script for seeding an admin user
 *
 * Usage:
 *   pnpm admin:seed --email <email> --password <password> [--name <name>] [--local]
 *
 * This script uses better-auth's sign-up API to create the user properly,
 * then updates the role to admin via D1.
 */

import { Command } from "commander";
import { execSync } from "child_process";

const program = new Command();

program
  .name("seed-admin")
  .description("Seed an admin user into the database")
  .requiredOption("-e, --email <email>", "Admin email address")
  .requiredOption("-p, --password <password>", "Admin password (min 8 characters)")
  .option("-n, --name <name>", "Admin display name", "Admin")
  .option("-l, --local", "Use local D1 database", true)
  .option("--api-url <url>", "API URL", "http://localhost:8787")
  .action(async (options) => {
    const { email, password, name, local, apiUrl } = options;

    if (password.length < 8) {
      console.error("Error: Password must be at least 8 characters");
      process.exit(1);
    }

    const localFlag = local ? "--local" : "";
    const configFlag = "-c apps/api/wrangler.jsonc";

    try {
      // Check if user already exists
      const checkCmd = `npx wrangler d1 execute vela-db ${localFlag} ${configFlag} --command "SELECT id FROM users WHERE email = '${email}'" --json`;
      const checkResult = execSync(checkCmd, { encoding: "utf-8" });
      const parsed = JSON.parse(checkResult);

      if (parsed[0]?.results?.length > 0) {
        console.error(`Error: User with email "${email}" already exists`);
        process.exit(1);
      }

      // Use better-auth's sign-up endpoint to create the user
      console.log("Creating user via better-auth API...");
      const signUpResponse = await fetch(`${apiUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": apiUrl,
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!signUpResponse.ok) {
        const errorData = await signUpResponse.json().catch(() => ({}));
        throw new Error(
          `Sign-up failed: ${signUpResponse.status} ${signUpResponse.statusText} - ${JSON.stringify(errorData)}`
        );
      }

      const userData = await signUpResponse.json();
      console.log("User created, updating role to admin...");

      // Update role to admin
      const updateCmd = `npx wrangler d1 execute vela-db ${localFlag} ${configFlag} --command "UPDATE users SET role = 'admin' WHERE email = '${email}'"`;
      execSync(updateCmd, { encoding: "utf-8", stdio: "pipe" });

      console.log(`\nAdmin user created successfully!`);
      console.log(`  Email: ${email}`);
      console.log(`  Name: ${name}`);
      console.log(`  Role: admin`);
      console.log(`\nYou can now log in at http://localhost:4321/auth/login`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("fetch")) {
        console.error("\nError: Could not connect to the API server.");
        console.error("Make sure the dev server is running with: pnpm dev");
        console.error(`Attempted to connect to: ${apiUrl}`);
      } else {
        console.error("Failed to create admin user:", error);
      }
      process.exit(1);
    }
  });

program.parse();
