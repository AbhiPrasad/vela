import type { D1Database } from "@cloudflare/workers-types";
import type {
  ScanResult,
  ScanStatus,
  ThirdPartyScript,
  ScriptPerformanceProfile,
  NetworkRequest,
  ScanSummary,
  Grade,
  Issue,
} from "@vela/shared";
import { matchUrl, isFirstParty, extractDomain } from "@vela/script-db";
import { BrowserService } from "./browser.js";

interface ScanRow {
  id: string;
  url: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  grade: string | null;
  total_scripts: number | null;
  total_bytes: number | null;
  total_main_thread_time: number | null;
  error_message: string | null;
  result_json: string | null;
}

export class ScanService {
  private browserService: BrowserService;

  constructor(
    private db: D1Database,
    browserBinding: Fetcher
  ) {
    this.browserService = new BrowserService(browserBinding);
  }

  /**
   * Create a new scan record
   */
  async createScan(url: string): Promise<{ id: string; status: ScanStatus }> {
    const id = crypto.randomUUID();

    await this.db
      .prepare(
        `INSERT INTO scans (id, url, status, created_at) VALUES (?, ?, ?, ?)`
      )
      .bind(id, url, "queued", new Date().toISOString())
      .run();

    return { id, status: "queued" };
  }

  /**
   * Get a scan by ID
   */
  async getScan(scanId: string): Promise<ScanResult | null> {
    const row = await this.db
      .prepare(`SELECT * FROM scans WHERE id = ?`)
      .bind(scanId)
      .first<ScanRow>();

    if (!row) {
      return null;
    }

    return this.rowToScanResult(row);
  }

  /**
   * List recent scans
   */
  async listScans(limit: number, offset: number): Promise<ScanResult[]> {
    const rows = await this.db
      .prepare(
        `SELECT * FROM scans ORDER BY created_at DESC LIMIT ? OFFSET ?`
      )
      .bind(limit, offset)
      .all<ScanRow>();

    return rows.results.map((row) => this.rowToScanResult(row));
  }

  /**
   * Execute the actual scan
   */
  async executeScan(scanId: string): Promise<ScanResult> {
    // Update status to running
    await this.updateScanStatus(scanId, "running");

    const row = await this.db
      .prepare(`SELECT url FROM scans WHERE id = ?`)
      .bind(scanId)
      .first<{ url: string }>();

    if (!row) {
      throw new Error("Scan not found");
    }

    const url = row.url;

    try {
      // Perform browser scan
      const browserResult = await this.browserService.scanPage(url);

      // Analyze scripts
      const scripts = this.analyzeScripts(browserResult.requests, url);
      const performance = this.analyzePerformance(browserResult, scripts);
      const summary = this.calculateSummary(scripts, performance, browserResult);

      // Build result
      const result: ScanResult = {
        id: scanId,
        url,
        status: "completed",
        createdAt: new Date(),
        completedAt: new Date(),
        duration: browserResult.duration,
        errorMessage: null,
        scripts,
        performance,
        privacy: [], // TODO: Implement privacy analysis
        networkRequests: browserResult.requests,
        summary,
      };

      // Save result
      await this.saveScanResult(result);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await this.db
        .prepare(
          `UPDATE scans SET status = ?, error_message = ?, completed_at = ? WHERE id = ?`
        )
        .bind("failed", errorMessage, new Date().toISOString(), scanId)
        .run();

      return {
        id: scanId,
        url,
        status: "failed",
        createdAt: new Date(),
        completedAt: new Date(),
        duration: null,
        errorMessage,
        scripts: [],
        performance: [],
        privacy: [],
        networkRequests: [],
        summary: null,
      };
    }
  }

  /**
   * Analyze network requests to identify third-party scripts
   */
  private analyzeScripts(
    requests: NetworkRequest[],
    pageUrl: string
  ): ThirdPartyScript[] {
    const scripts: ThirdPartyScript[] = [];
    const scriptRequests = requests.filter(
      (r) => r.type === "script" && !isFirstParty(r.url, pageUrl)
    );

    for (const request of scriptRequests) {
      const match = matchUrl(request.url);

      scripts.push({
        url: request.url,
        category: match.pattern?.category ?? "other",
        vendor: match.pattern?.vendor ?? null,
        fingerprint: this.hashString(request.url),
        confidence: match.confidence,
        async: false, // Would need DOM analysis to determine
        defer: false,
        sizeBytes: request.sizeBytes,
      });
    }

    return scripts;
  }

  /**
   * Analyze performance metrics per script
   */
  private analyzePerformance(
    browserResult: Awaited<ReturnType<BrowserService["scanPage"]>>,
    scripts: ThirdPartyScript[]
  ): ScriptPerformanceProfile[] {
    return scripts.map((script) => {
      // Find all requests initiated by this script
      const relatedRequests = browserResult.requests.filter(
        (r) => r.initiator === script.url
      );

      return {
        scriptUrl: script.url,
        metrics: {
          mainThreadTime: 0, // Would need profiler data
          networkRequests: relatedRequests.length + 1,
          bytesTransferred:
            script.sizeBytes +
            relatedRequests.reduce((sum, r) => sum + r.sizeBytes, 0),
          domMutations: 0, // Would need DOM observer
          longTasks: 0, // Would need long task observer
        },
        webVitalsImpact: {
          lcpDelta: null,
          clsDelta: null,
          inpDelta: null,
        },
      };
    });
  }

  /**
   * Calculate summary and grade
   */
  private calculateSummary(
    scripts: ThirdPartyScript[],
    performance: ScriptPerformanceProfile[],
    browserResult: Awaited<ReturnType<BrowserService["scanPage"]>>
  ): ScanSummary {
    const totalBytes = performance.reduce(
      (sum, p) => sum + p.metrics.bytesTransferred,
      0
    );
    const totalMainThreadTime = performance.reduce(
      (sum, p) => sum + p.metrics.mainThreadTime,
      0
    );
    const totalRequests = browserResult.requests.length;

    // Count by category
    const categoryBreakdown: Record<string, number> = {};
    for (const script of scripts) {
      categoryBreakdown[script.category] =
        (categoryBreakdown[script.category] ?? 0) + 1;
    }

    // Calculate grade
    const grade = this.calculateGrade(
      scripts.length,
      totalBytes,
      totalMainThreadTime
    );

    // Generate issues
    const issues = this.generateIssues(scripts, performance);

    return {
      totalScripts: scripts.length,
      totalRequests,
      totalBytes,
      totalMainThreadTime,
      grade,
      topIssues: issues.slice(0, 5),
      categoryBreakdown,
    };
  }

  /**
   * Calculate letter grade based on metrics
   */
  private calculateGrade(
    scriptCount: number,
    totalBytes: number,
    mainThreadTime: number
  ): Grade {
    let score = 100;

    // Deduct for script count
    if (scriptCount > 20) score -= 30;
    else if (scriptCount > 10) score -= 20;
    else if (scriptCount > 5) score -= 10;

    // Deduct for total bytes (in KB)
    const bytesKB = totalBytes / 1024;
    if (bytesKB > 2000) score -= 30;
    else if (bytesKB > 1000) score -= 20;
    else if (bytesKB > 500) score -= 10;

    // Deduct for main thread time
    if (mainThreadTime > 3000) score -= 30;
    else if (mainThreadTime > 2000) score -= 20;
    else if (mainThreadTime > 1000) score -= 10;

    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  /**
   * Generate issues based on analysis
   */
  private generateIssues(
    scripts: ThirdPartyScript[],
    performance: ScriptPerformanceProfile[]
  ): Issue[] {
    const issues: Issue[] = [];

    // Check for large scripts
    for (const script of scripts) {
      if (script.sizeBytes > 100 * 1024) {
        issues.push({
          severity: "warning",
          category: "performance",
          title: "Large script detected",
          description: `${extractDomain(script.url)} is ${Math.round(script.sizeBytes / 1024)}KB`,
          scriptUrl: script.url,
          recommendation: "Consider lazy loading or finding a lighter alternative",
        });
      }
    }

    // Check for too many analytics
    const analyticsScripts = scripts.filter((s) => s.category === "analytics");
    if (analyticsScripts.length > 2) {
      issues.push({
        severity: "warning",
        category: "performance",
        title: "Multiple analytics scripts",
        description: `Found ${analyticsScripts.length} analytics scripts`,
        scriptUrl: null,
        recommendation: "Consolidate analytics to reduce overhead",
      });
    }

    // Check for too many scripts total
    if (scripts.length > 15) {
      issues.push({
        severity: "critical",
        category: "performance",
        title: "Too many third-party scripts",
        description: `Found ${scripts.length} third-party scripts`,
        scriptUrl: null,
        recommendation: "Audit and remove unnecessary scripts",
      });
    }

    return issues.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Update scan status
   */
  private async updateScanStatus(
    scanId: string,
    status: ScanStatus
  ): Promise<void> {
    await this.db
      .prepare(`UPDATE scans SET status = ? WHERE id = ?`)
      .bind(status, scanId)
      .run();
  }

  /**
   * Save completed scan result
   */
  private async saveScanResult(result: ScanResult): Promise<void> {
    await this.db
      .prepare(
        `UPDATE scans SET
          status = ?,
          completed_at = ?,
          grade = ?,
          total_scripts = ?,
          total_bytes = ?,
          total_main_thread_time = ?,
          result_json = ?
        WHERE id = ?`
      )
      .bind(
        result.status,
        result.completedAt?.toISOString() ?? null,
        result.summary?.grade ?? null,
        result.summary?.totalScripts ?? null,
        result.summary?.totalBytes ?? null,
        result.summary?.totalMainThreadTime ?? null,
        JSON.stringify(result),
        result.id
      )
      .run();
  }

  /**
   * Convert database row to ScanResult
   */
  private rowToScanResult(row: ScanRow): ScanResult {
    // If we have full result JSON, use that
    if (row.result_json) {
      const parsed = JSON.parse(row.result_json) as ScanResult;
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        completedAt: parsed.completedAt ? new Date(parsed.completedAt) : null,
      };
    }

    // Otherwise return minimal result
    return {
      id: row.id,
      url: row.url,
      status: row.status as ScanStatus,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      duration: null,
      errorMessage: row.error_message,
      scripts: [],
      performance: [],
      privacy: [],
      networkRequests: [],
      summary: row.grade
        ? {
            totalScripts: row.total_scripts ?? 0,
            totalRequests: 0,
            totalBytes: row.total_bytes ?? 0,
            totalMainThreadTime: row.total_main_thread_time ?? 0,
            grade: row.grade as Grade,
            topIssues: [],
            categoryBreakdown: {},
          }
        : null,
    };
  }

  /**
   * Simple string hash
   */
  private hashString(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  }
}
