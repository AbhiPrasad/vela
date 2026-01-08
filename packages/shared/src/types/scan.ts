import type { ThirdPartyScript } from "./script.js";
import type { ScriptPerformanceProfile, NetworkRequest } from "./performance.js";
import type { PrivacyProfile } from "./privacy.js";

/**
 * Overall grade for a scan result
 */
export type Grade = "A" | "B" | "C" | "D" | "F";

/**
 * Status of a scan job
 */
export type ScanStatus = "queued" | "running" | "completed" | "failed";

/**
 * Severity of an issue
 */
export type IssueSeverity = "critical" | "warning" | "info";

/**
 * An issue detected during scanning
 */
export interface Issue {
  /** Issue severity */
  severity: IssueSeverity;
  /** Issue category */
  category: "performance" | "privacy" | "security" | "best-practice";
  /** Short title */
  title: string;
  /** Detailed description */
  description: string;
  /** Script URL related to this issue, if applicable */
  scriptUrl: string | null;
  /** Actionable recommendation */
  recommendation: string;
}

/**
 * Summary statistics for a scan
 */
export interface ScanSummary {
  /** Total number of third-party scripts detected */
  totalScripts: number;
  /** Total network requests made */
  totalRequests: number;
  /** Total bytes transferred */
  totalBytes: number;
  /** Total main thread blocking time (ms) */
  totalMainThreadTime: number;
  /** Overall grade */
  grade: Grade;
  /** Top issues found */
  topIssues: Issue[];
  /** Breakdown by script category */
  categoryBreakdown: Record<string, number>;
}

/**
 * Complete result of a URL scan
 */
export interface ScanResult {
  /** Unique scan ID */
  id: string;
  /** URL that was scanned */
  url: string;
  /** Current status of the scan */
  status: ScanStatus;
  /** When the scan was initiated */
  createdAt: Date;
  /** When the scan completed */
  completedAt: Date | null;
  /** How long the scan took (ms) */
  duration: number | null;
  /** Error message if scan failed */
  errorMessage: string | null;
  /** All detected third-party scripts */
  scripts: ThirdPartyScript[];
  /** Performance profiles per script */
  performance: ScriptPerformanceProfile[];
  /** Privacy profiles per script */
  privacy: PrivacyProfile[];
  /** All network requests captured */
  networkRequests: NetworkRequest[];
  /** Summary statistics and grade */
  summary: ScanSummary | null;
}

/**
 * Request to create a new scan
 */
export interface CreateScanRequest {
  /** URL to scan */
  url: string;
}

/**
 * Response when creating a scan
 */
export interface CreateScanResponse {
  /** Scan ID to poll for results */
  id: string;
  /** Current status */
  status: ScanStatus;
}
