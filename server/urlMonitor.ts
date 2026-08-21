import { lookup } from "node:dns/promises";
import net from "node:net";

export type UrlCheckResult = {
  url: string;
  ok: boolean;
  reachable: boolean;
  statusCode?: number;
  statusText?: string;
  latencyMs: number;
  contentType?: string;
  healthStatus?: "healthy" | "unhealthy" | "unknown";
  detail: string;
};

export type UrlCheckBundle = {
  checkedAt: string;
  application: UrlCheckResult;
  health?: UrlCheckResult;
  overall: "healthy" | "degraded" | "unreachable";
};

export const URL_TEST_PRESETS = [
  {
    id: "example-httpbin",
    name: "Public demo application",
    applicationUrl: "https://example.com",
    healthUrl: "https://httpbin.org/status/200",
    description: "A stable public homepage plus an HTTP 200 health probe.",
  },
  {
    id: "httpbin-failure",
    name: "Failure simulation",
    applicationUrl: "https://example.com",
    healthUrl: "https://httpbin.org/status/503",
    description: "The health probe intentionally returns HTTP 503 for testing.",
  },
] as const;

const MAX_RESPONSE_BYTES = 256 * 1024;
const DEFAULT_TIMEOUT_MS = 8_000;

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized === "0:0:0:0:0:0:0:1" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd") || isPrivateIpv4(normalized);
}

export function validateMonitorUrl(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("Enter a complete URL beginning with https:// or http://");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only HTTP and HTTPS URLs are supported");
  if (parsed.username || parsed.password) throw new Error("URLs with embedded credentials are not supported");
  if (parsed.port && !["80", "443"].includes(parsed.port)) throw new Error("Only standard HTTP and HTTPS ports are supported");
  if (parsed.hostname === "localhost" || parsed.hostname.endsWith(".local") || net.isIP(parsed.hostname) && isPrivateAddress(parsed.hostname)) {
    throw new Error("Local and private network addresses are not allowed");
  }
  return parsed.toString();
}

async function assertPublicHost(url: URL) {
  const records = await lookup(url.hostname, { all: true, verbatim: true });
  if (!records.length || records.some(record => isPrivateAddress(record.address))) throw new Error("The URL resolves to a local or private network address");
}

async function readLimitedBody(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    total += next.value.byteLength;
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error("Response exceeded the 256 KB monitoring limit");
    }
    chunks.push(next.value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function checkUrl(rawUrl: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<UrlCheckResult> {
  const url = validateMonitorUrl(rawUrl);
  const parsed = new URL(url);
  const startedAt = Date.now();
  try {
    await assertPublicHost(parsed);
    const response = await fetch(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(timeoutMs), headers: { accept: "application/json,text/html;q=0.9,*/*;q=0.8", "user-agent": "Nexia-Transient-Monitor/1.0" } });
    const contentType = response.headers.get("content-type") ?? undefined;
    const body = await readLimitedBody(response);
    const isJson = contentType?.includes("application/json");
    let healthStatus: UrlCheckResult["healthStatus"] = "unknown";
    if (isJson) {
      try {
        const payload = JSON.parse(body) as Record<string, unknown>;
        if (payload.status === "healthy" || payload.status === "unhealthy") healthStatus = payload.status;
      } catch {
        healthStatus = "unknown";
      }
    }
    const ok = response.status >= 200 && response.status < 400 && healthStatus !== "unhealthy";
    return { url, ok, reachable: true, statusCode: response.status, statusText: response.statusText, latencyMs: Date.now() - startedAt, contentType, healthStatus, detail: ok ? "Endpoint responded successfully" : `Endpoint returned HTTP ${response.status}` };
  } catch (error) {
    return { url, ok: false, reachable: false, latencyMs: Date.now() - startedAt, detail: error instanceof Error ? error.message : "Endpoint check failed" };
  }
}

export async function checkConfiguredUrls(applicationUrl: string, healthUrl?: string): Promise<UrlCheckBundle> {
  const checkedAt = new Date().toISOString();
  const application = await checkUrl(applicationUrl);
  const health = healthUrl ? await checkUrl(healthUrl) : undefined;
  const overall = !application.reachable || health && !health.reachable ? "unreachable" : application.ok && (!health || health.ok) ? "healthy" : "degraded";
  return { checkedAt, application, health, overall };
}
