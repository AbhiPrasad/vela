/**
 * Cookie information captured during scan
 */
export interface CookieInfo {
  /** Cookie name */
  name: string;
  /** Cookie domain */
  domain: string;
  /** Cookie path */
  path: string;
  /** Whether the cookie is secure */
  secure: boolean;
  /** Whether the cookie is HTTP-only */
  httpOnly: boolean;
  /** SameSite attribute */
  sameSite: "Strict" | "Lax" | "None" | null;
  /** Expiration date (null for session cookies) */
  expires: Date | null;
  /** Size in bytes */
  sizeBytes: number;
  /** Script that set this cookie, if attributable */
  setBy: string | null;
}

/**
 * Storage entry (localStorage/sessionStorage)
 */
export interface StorageEntry {
  /** Storage key */
  key: string;
  /** Size of value in bytes */
  sizeBytes: number;
  /** Script that set this entry, if attributable */
  setBy: string | null;
}

/**
 * Types of data detected in outbound requests
 */
export type DataType =
  | "ip"
  | "user-agent"
  | "referrer"
  | "url"
  | "custom-id"
  | "email"
  | "device-info"
  | "geolocation"
  | "unknown";

/**
 * Fingerprinting techniques that may be in use
 */
export type FingerprintTechnique =
  | "canvas"
  | "webgl"
  | "audio"
  | "fonts"
  | "screen"
  | "plugins"
  | "timezone"
  | "language"
  | "hardware-concurrency";

/**
 * Outbound data transfer detected
 */
export interface OutboundData {
  /** Endpoint receiving the data */
  endpoint: string;
  /** Types of data being sent */
  dataTypes: DataType[];
  /** Whether data is sent to a different country */
  crossBorder: boolean;
  /** Script initiating the transfer */
  initiator: string | null;
}

/**
 * Privacy analysis for a scanned page
 */
export interface PrivacyProfile {
  /** Script URL this profile is for */
  scriptUrl: string;
  /** Cookies set by this script */
  cookies: CookieInfo[];
  /** localStorage entries */
  localStorage: StorageEntry[];
  /** sessionStorage entries */
  sessionStorage: StorageEntry[];
  /** Detected outbound data transfers */
  outboundData: OutboundData[];
  /** Fingerprinting techniques detected */
  fingerprintingSignals: FingerprintTechnique[];
}
