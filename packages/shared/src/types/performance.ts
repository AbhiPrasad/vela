/**
 * Performance metrics attributed to a specific script
 */
export interface ScriptPerformanceProfile {
  /** URL of the script */
  scriptUrl: string;
  /** Core performance metrics */
  metrics: {
    /** Milliseconds of main thread blocking */
    mainThreadTime: number;
    /** Total network requests initiated by this script */
    networkRequests: number;
    /** Total bytes transferred */
    bytesTransferred: number;
    /** Number of DOM mutations made */
    domMutations: number;
    /** Number of long tasks (50ms+) attributed to this script */
    longTasks: number;
  };
  /** Estimated impact on Core Web Vitals */
  webVitalsImpact: {
    /** Estimated LCP impact in milliseconds */
    lcpDelta: number | null;
    /** Estimated CLS impact score */
    clsDelta: number | null;
    /** Estimated INP impact in milliseconds */
    inpDelta: number | null;
  };
}

/**
 * A network request made during page load
 */
export interface NetworkRequest {
  /** Request URL */
  url: string;
  /** Resource type */
  type: ResourceType;
  /** HTTP method */
  method: string;
  /** Response status code */
  statusCode: number | null;
  /** Size in bytes */
  sizeBytes: number;
  /** Time to complete in milliseconds */
  durationMs: number;
  /** Script URL that initiated this request, if attributable */
  initiator: string | null;
  /** Whether this is a third-party request */
  isThirdParty: boolean;
}

export type ResourceType =
  | "document"
  | "script"
  | "stylesheet"
  | "image"
  | "font"
  | "xhr"
  | "fetch"
  | "websocket"
  | "other";
