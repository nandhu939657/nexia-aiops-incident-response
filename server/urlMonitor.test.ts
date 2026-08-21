import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { lookup } from "node:dns/promises";

vi.mock("node:dns/promises", () => ({ lookup: vi.fn() }));

import { URL_TEST_PRESETS, checkConfiguredUrls, checkUrl, validateMonitorUrl } from "./urlMonitor";

const lookupMock = vi.mocked(lookup);

describe("transient URL monitor", () => {
  beforeEach(() => lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as never));
  afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

  it("accepts public HTTP(S) URLs and rejects private targets", () => {
    expect(validateMonitorUrl("https://example.com")).toBe("https://example.com/");
    expect(() => validateMonitorUrl("http://localhost:4000/health")).toThrow(/standard HTTP/);
    expect(() => validateMonitorUrl("https://127.0.0.1/health")).toThrow(/Local and private/);
    expect(() => validateMonitorUrl("ftp://example.com")).toThrow(/HTTP and HTTPS/);
  });

  it("ships safe public success and failure presets", () => {
    expect(URL_TEST_PRESETS).toHaveLength(2);
    expect(URL_TEST_PRESETS[0].healthUrl).toContain("status/200");
    expect(URL_TEST_PRESETS[1].healthUrl).toContain("status/503");
  });

  it("parses a healthy JSON status and detects an HTTP failure", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "healthy" }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response("", { status: 503, statusText: "Service Unavailable" })));
    const healthy = await checkUrl("https://example.com/health");
    const failed = await checkUrl("https://example.com/failure");
    expect(healthy.ok).toBe(true);
    expect(healthy.healthStatus).toBe("healthy");
    expect(failed.ok).toBe(false);
    expect(failed.statusCode).toBe(503);
  });

  it("returns a healthy result without persisting submitted URLs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("ok", { status: 200 })).mockResolvedValueOnce(new Response("ok", { status: 200 })));
    const result = await checkConfiguredUrls("https://example.com", "https://example.com/health");
    expect(result.overall).toBe("healthy");
    expect(result.application.url).toBe("https://example.com/");
    expect(result.health?.url).toBe("https://example.com/health");
  });
});
