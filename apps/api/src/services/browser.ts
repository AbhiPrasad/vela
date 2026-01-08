import type { NetworkRequest, ResourceType } from "@vela/shared";

interface PuppeteerRequest {
  url: () => string;
  resourceType: () => string;
  method: () => string;
}

interface PuppeteerResponse {
  url: () => string;
  status: () => number;
  headers: () => Record<string, string>;
}

interface PageMetrics {
  JSHeapUsedSize: number;
  ScriptDuration: number;
}

/**
 * Browser service for scanning pages using Cloudflare Browser Rendering
 */
export class BrowserService {
  constructor(private browserBinding: Fetcher) {}

  /**
   * Scan a page and collect network requests and metrics
   */
  async scanPage(url: string): Promise<{
    requests: NetworkRequest[];
    metrics: PageMetrics;
    duration: number;
  }> {
    const startTime = Date.now();

    // Dynamic import for Puppeteer (only available in worker context)
    const puppeteer = await import("@cloudflare/puppeteer");

    const browser = await puppeteer.default.launch(this.browserBinding);
    const page = await browser.newPage();

    const requests: NetworkRequest[] = [];
    const requestTimings = new Map<string, number>();

    // Set up request interception
    await page.setRequestInterception(true);

    page.on("request", (req: PuppeteerRequest) => {
      requestTimings.set(req.url(), Date.now());
      // Continue the request (type assertion needed due to puppeteer types)
      (req as unknown as { continue: () => void }).continue();
    });

    page.on("response", (res: PuppeteerResponse) => {
      const url = res.url();
      const startAt = requestTimings.get(url) ?? Date.now();
      const duration = Date.now() - startAt;

      const contentLength = res.headers()["content-length"];
      const sizeBytes = contentLength ? parseInt(contentLength, 10) : 0;

      // Determine initiator (simplified - would need CDP for accurate attribution)
      const initiator = this.guessInitiator(url, requests);

      requests.push({
        url,
        type: this.mapResourceType(
          // Get resource type from the response's request
          (res as unknown as { request: () => PuppeteerRequest }).request?.()?.resourceType?.() ?? "other"
        ),
        method: "GET", // Simplified
        statusCode: res.status(),
        sizeBytes,
        durationMs: duration,
        initiator,
        isThirdParty: this.isThirdPartyUrl(url, url),
      });
    });

    try {
      // Navigate to the page
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Get page metrics
      const metrics = (await page.metrics()) as PageMetrics;

      await browser.close();

      const duration = Date.now() - startTime;

      // Update isThirdParty now that we know the page URL
      const pageHost = new URL(url).hostname;
      for (const request of requests) {
        request.isThirdParty = this.isThirdPartyUrl(request.url, url);
      }

      return {
        requests,
        metrics,
        duration,
      };
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  /**
   * Map Puppeteer resource type to our ResourceType
   */
  private mapResourceType(type: string): ResourceType {
    const typeMap: Record<string, ResourceType> = {
      document: "document",
      script: "script",
      stylesheet: "stylesheet",
      image: "image",
      font: "font",
      xhr: "xhr",
      fetch: "fetch",
      websocket: "websocket",
    };

    return typeMap[type] ?? "other";
  }

  /**
   * Check if a URL is third-party relative to the page
   */
  private isThirdPartyUrl(requestUrl: string, pageUrl: string): boolean {
    try {
      const requestHost = new URL(requestUrl).hostname;
      const pageHost = new URL(pageUrl).hostname;

      if (requestHost === pageHost) {
        return false;
      }

      // Check if subdomain of same root domain
      const getBaseDomain = (host: string): string => {
        const parts = host.split(".");
        if (parts.length <= 2) return host;
        return parts.slice(-2).join(".");
      };

      return getBaseDomain(requestHost) !== getBaseDomain(pageHost);
    } catch {
      return true;
    }
  }

  /**
   * Try to guess the initiator of a request (simplified)
   * In production, would use CDP to get accurate initiator stack
   */
  private guessInitiator(
    url: string,
    existingRequests: NetworkRequest[]
  ): string | null {
    // Scripts loaded from known third-party domains are likely initiated by other scripts
    // This is a simplification - real implementation would use CDP
    const scriptRequests = existingRequests.filter((r) => r.type === "script");

    // Check if this request's domain matches a loaded script's domain
    try {
      const requestDomain = new URL(url).hostname;

      for (const script of scriptRequests) {
        const scriptDomain = new URL(script.url).hostname;
        if (
          requestDomain.includes(scriptDomain.split(".").slice(-2).join("."))
        ) {
          return script.url;
        }
      }
    } catch {
      // Invalid URL
    }

    return null;
  }
}
