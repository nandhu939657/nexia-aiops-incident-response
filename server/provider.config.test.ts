import { afterEach, describe, expect, it } from "vitest";
import { providerConnectionStatus } from "./incidentEngine";

const original = {
  firecrawl: process.env.FIRECRAWL_API_KEY,
  apify: process.env.APIFY_API_TOKEN,
};

afterEach(() => {
  if (original.firecrawl === undefined) delete process.env.FIRECRAWL_API_KEY; else process.env.FIRECRAWL_API_KEY = original.firecrawl;
  if (original.apify === undefined) delete process.env.APIFY_API_TOKEN; else process.env.APIFY_API_TOKEN = original.apify;
});

describe("provider configuration", () => {
  it("reports webhook-only mode when provider tokens are absent", () => {
    delete process.env.FIRECRAWL_API_KEY;
    delete process.env.APIFY_API_TOKEN;
    const status = providerConnectionStatus();
    expect(status.internal.configured).toBe(true);
    expect(status.firecrawl.configured).toBe(false);
    expect(status.apify.configured).toBe(false);
  });

  it("reports configured provider polling when tokens exist", () => {
    process.env.FIRECRAWL_API_KEY = "test-firecrawl-token";
    process.env.APIFY_API_TOKEN = "test-apify-token";
    const status = providerConnectionStatus();
    expect(status.firecrawl.configured).toBe(true);
    expect(status.apify.configured).toBe(true);
  });
});
