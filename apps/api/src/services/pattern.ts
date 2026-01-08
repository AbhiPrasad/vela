import { eq, like, or, and } from "drizzle-orm";
import type { ScriptCategory } from "@vela/shared";
import type { Database, KnownScript, NewKnownScript } from "../db/index.js";
import { knownScripts } from "../db/schema.js";
import { matchesPattern } from "../utils/url.js";

/**
 * Result of matching a URL against the script database
 */
export interface MatchResult {
  pattern: ScriptPatternData | null;
  confidence: number;
}

/**
 * Script pattern data (parsed from DB row)
 */
export interface ScriptPatternData {
  id: string;
  name: string;
  vendor: string;
  category: ScriptCategory;
  urlPatterns: string[];
  globalVariables: string[];
  knownIssues: string[];
  alternatives: string[];
  docsUrl: string | null;
}

/**
 * Input for creating/updating a pattern
 */
export interface PatternInput {
  id: string;
  name: string;
  vendor: string;
  category: string;
  urlPatterns: string[];
  globalVariables?: string[];
  knownIssues?: string[];
  alternatives?: string[];
  docsUrl?: string | null;
}

/**
 * Filters for listing patterns
 */
export interface PatternFilters {
  category?: ScriptCategory;
  vendor?: string;
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Service for managing script patterns in D1 database
 */
export class PatternService {
  constructor(private db: Database) {}

  /**
   * Convert a database row to ScriptPatternData
   */
  private toPatternData(row: KnownScript): ScriptPatternData {
    return {
      id: row.id,
      name: row.name,
      vendor: row.vendor,
      category: row.category as ScriptCategory,
      urlPatterns: JSON.parse(row.urlPatterns) as string[],
      globalVariables: row.globalVariables ? JSON.parse(row.globalVariables) as string[] : [],
      knownIssues: row.knownIssues ? JSON.parse(row.knownIssues) as string[] : [],
      alternatives: row.alternatives ? JSON.parse(row.alternatives) as string[] : [],
      docsUrl: row.docsUrl,
    };
  }

  /**
   * Find a matching script pattern for a given URL
   */
  async matchUrl(url: string): Promise<MatchResult> {
    const patterns = await this.db
      .select()
      .from(knownScripts)
      .where(eq(knownScripts.isActive, true));

    for (const row of patterns) {
      const urlPatterns = JSON.parse(row.urlPatterns) as string[];
      for (const urlPattern of urlPatterns) {
        if (matchesPattern(url, urlPattern)) {
          return {
            pattern: this.toPatternData(row),
            confidence: 1.0,
          };
        }
      }
    }

    return {
      pattern: null,
      confidence: 0,
    };
  }

  /**
   * Find all matching patterns for a list of URLs
   */
  async matchUrls(urls: string[]): Promise<Map<string, MatchResult>> {
    const results = new Map<string, MatchResult>();

    // Fetch all active patterns once
    const patterns = await this.db
      .select()
      .from(knownScripts)
      .where(eq(knownScripts.isActive, true));

    for (const url of urls) {
      let matched = false;
      for (const row of patterns) {
        const urlPatterns = JSON.parse(row.urlPatterns) as string[];
        for (const urlPattern of urlPatterns) {
          if (matchesPattern(url, urlPattern)) {
            results.set(url, {
              pattern: this.toPatternData(row),
              confidence: 1.0,
            });
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
      if (!matched) {
        results.set(url, { pattern: null, confidence: 0 });
      }
    }

    return results;
  }

  /**
   * Get all patterns with optional filters
   */
  async getAllPatterns(filters: PatternFilters = {}): Promise<ScriptPatternData[]> {
    const conditions = [];

    if (filters.isActive !== undefined) {
      conditions.push(eq(knownScripts.isActive, filters.isActive));
    } else {
      conditions.push(eq(knownScripts.isActive, true));
    }

    if (filters.category) {
      conditions.push(eq(knownScripts.category, filters.category));
    }

    if (filters.vendor) {
      conditions.push(eq(knownScripts.vendor, filters.vendor));
    }

    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(knownScripts.name, searchPattern),
          like(knownScripts.vendor, searchPattern)
        )
      );
    }

    let query = this.db
      .select()
      .from(knownScripts)
      .where(and(...conditions));

    if (filters.limit) {
      query = query.limit(filters.limit) as typeof query;
    }

    if (filters.offset) {
      query = query.offset(filters.offset) as typeof query;
    }

    const rows = await query;
    return rows.map((row) => this.toPatternData(row));
  }

  /**
   * Get a pattern by ID
   */
  async getPatternById(id: string): Promise<ScriptPatternData | null> {
    const rows = await this.db
      .select()
      .from(knownScripts)
      .where(eq(knownScripts.id, id))
      .limit(1);

    const row = rows[0];
    return row ? this.toPatternData(row) : null;
  }

  /**
   * Get patterns by category
   */
  async getPatternsByCategory(category: ScriptCategory): Promise<ScriptPatternData[]> {
    return this.getAllPatterns({ category });
  }

  /**
   * Get patterns by vendor
   */
  async getPatternsByVendor(vendor: string): Promise<ScriptPatternData[]> {
    return this.getAllPatterns({ vendor });
  }

  /**
   * Search patterns by name or vendor
   */
  async searchPatterns(query: string): Promise<ScriptPatternData[]> {
    return this.getAllPatterns({ search: query });
  }

  /**
   * Create a new pattern
   */
  async createPattern(input: PatternInput, userId?: string): Promise<ScriptPatternData> {
    const now = new Date();
    const newPattern: NewKnownScript = {
      id: input.id,
      name: input.name,
      vendor: input.vendor,
      category: input.category,
      urlPatterns: JSON.stringify(input.urlPatterns),
      globalVariables: input.globalVariables ? JSON.stringify(input.globalVariables) : null,
      knownIssues: input.knownIssues ? JSON.stringify(input.knownIssues) : null,
      alternatives: input.alternatives ? JSON.stringify(input.alternatives) : null,
      docsUrl: input.docsUrl ?? null,
      isActive: true,
      createdBy: userId ?? null,
      lastModifiedBy: userId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(knownScripts).values(newPattern);

    return this.toPatternData({
      ...newPattern,
      avgMainThreadTime: null,
      communityRating: null,
    } as KnownScript);
  }

  /**
   * Update an existing pattern
   */
  async updatePattern(id: string, input: Partial<PatternInput>, userId?: string): Promise<ScriptPatternData | null> {
    const existing = await this.getPatternById(id);
    if (!existing) return null;

    const updates: Partial<KnownScript> = {
      updatedAt: new Date(),
      lastModifiedBy: userId ?? null,
    };

    if (input.name !== undefined) updates.name = input.name;
    if (input.vendor !== undefined) updates.vendor = input.vendor;
    if (input.category !== undefined) updates.category = input.category;
    if (input.urlPatterns !== undefined) updates.urlPatterns = JSON.stringify(input.urlPatterns);
    if (input.globalVariables !== undefined) updates.globalVariables = JSON.stringify(input.globalVariables);
    if (input.knownIssues !== undefined) updates.knownIssues = JSON.stringify(input.knownIssues);
    if (input.alternatives !== undefined) updates.alternatives = JSON.stringify(input.alternatives);
    if (input.docsUrl !== undefined) updates.docsUrl = input.docsUrl;

    await this.db
      .update(knownScripts)
      .set(updates)
      .where(eq(knownScripts.id, id));

    return this.getPatternById(id);
  }

  /**
   * Soft delete a pattern (set isActive to false)
   */
  async deletePattern(id: string, userId?: string): Promise<boolean> {
    // Check if pattern exists first
    const existing = await this.getPatternById(id);
    if (!existing) return false;

    await this.db
      .update(knownScripts)
      .set({
        isActive: false,
        updatedAt: new Date(),
        lastModifiedBy: userId ?? null,
      })
      .where(eq(knownScripts.id, id));

    return true;
  }

  /**
   * Hard delete a pattern (permanent)
   */
  async hardDeletePattern(id: string): Promise<boolean> {
    // Check if pattern exists first
    const existing = await this.db
      .select({ id: knownScripts.id })
      .from(knownScripts)
      .where(eq(knownScripts.id, id))
      .limit(1);

    if (existing.length === 0) return false;

    await this.db
      .delete(knownScripts)
      .where(eq(knownScripts.id, id));

    return true;
  }

  /**
   * Get all unique categories with counts
   */
  async getCategories(): Promise<{ category: string; count: number }[]> {
    const patterns = await this.db
      .select()
      .from(knownScripts)
      .where(eq(knownScripts.isActive, true));

    const counts = new Map<string, number>();
    for (const p of patterns) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }

  /**
   * Get all unique vendors with counts
   */
  async getVendors(): Promise<{ vendor: string; count: number }[]> {
    const patterns = await this.db
      .select()
      .from(knownScripts)
      .where(eq(knownScripts.isActive, true));

    const counts = new Map<string, number>();
    for (const p of patterns) {
      counts.set(p.vendor, (counts.get(p.vendor) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([vendor, count]) => ({
      vendor,
      count,
    }));
  }
}
