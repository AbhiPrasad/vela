import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

// ============================================================================
// Auth Tables (better-auth compatible)
// ============================================================================

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
    name: text("name"),
    image: text("image"),
    role: text("role", { enum: ["user", "editor", "admin"] }).default("user"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  },
  (table) => [index("idx_users_email").on(table.email)]
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_sessions_user_id").on(table.userId),
    index("idx_sessions_token").on(table.token),
  ]
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  },
  (table) => [index("idx_accounts_user_id").on(table.userId)]
);

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================================================
// Application Tables
// ============================================================================

export const scans = sqliteTable(
  "scans",
  {
    id: text("id").primaryKey(),
    url: text("url").notNull(),
    status: text("status", { enum: ["queued", "running", "completed", "failed"] }).default("queued"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    grade: text("grade", { enum: ["A", "B", "C", "D", "F"] }),
    totalScripts: integer("total_scripts"),
    totalBytes: integer("total_bytes"),
    totalMainThreadTime: integer("total_main_thread_time"),
    errorMessage: text("error_message"),
    resultJson: text("result_json"),
  },
  (table) => [
    index("idx_scans_created_at").on(table.createdAt),
    index("idx_scans_url").on(table.url),
    index("idx_scans_status").on(table.status),
  ]
);

export const scanScripts = sqliteTable(
  "scan_scripts",
  {
    id: text("id").primaryKey(),
    scanId: text("scan_id")
      .notNull()
      .references(() => scans.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    category: text("category"),
    vendor: text("vendor"),
    sizeBytes: integer("size_bytes"),
    mainThreadTimeMs: integer("main_thread_time_ms"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  },
  (table) => [index("idx_scan_scripts_scan_id").on(table.scanId)]
);

export const knownScripts = sqliteTable(
  "known_scripts",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    vendor: text("vendor").notNull(),
    category: text("category").notNull(),
    urlPatterns: text("url_patterns").notNull(), // JSON array
    globalVariables: text("global_variables"), // JSON array
    knownIssues: text("known_issues"), // JSON array
    alternatives: text("alternatives"), // JSON array
    docsUrl: text("docs_url"),
    avgMainThreadTime: integer("avg_main_thread_time"),
    communityRating: real("community_rating"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdBy: text("created_by").references(() => users.id),
    lastModifiedBy: text("last_modified_by").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  },
  (table) => [
    index("idx_known_scripts_vendor").on(table.vendor),
    index("idx_known_scripts_category").on(table.category),
    index("idx_known_scripts_active").on(table.isActive),
  ]
);

// ============================================================================
// Type exports
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;
export type ScanScript = typeof scanScripts.$inferSelect;
export type NewScanScript = typeof scanScripts.$inferInsert;
export type KnownScript = typeof knownScripts.$inferSelect;
export type NewKnownScript = typeof knownScripts.$inferInsert;
