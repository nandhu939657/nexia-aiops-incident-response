import { beforeEach, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getJob, heartbeatJob, simulateJobFailure } from "./incidentEngine";

const ctx = { user: null, req: {} as never, res: {} as never };

describe("monitored background jobs", () => {
  beforeEach(() => {
    heartbeatJob({ id: "job-order-reconciliation", status: "healthy" });
    heartbeatJob({ id: "job-firecrawl-docs", status: "succeeded", externalId: "crawl_demo_docs_001" });
    heartbeatJob({ id: "job-apify-leads", status: "failed", externalId: "run_demo_leads_001" });
  });

  it("accepts internal heartbeats and preserves normalized job fields", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.jobs.heartbeat({ id: "job-order-reconciliation", status: "healthy", durationMs: 2400, metadata: { queue: "orders" } });
    expect(result.status).toBe("healthy");
    expect(result.durationMs).toBe(2400);
    expect(result.metadata.queue).toBe("orders");
  });

  it("normalizes provider events for Firecrawl and Apify", async () => {
    const caller = appRouter.createCaller(ctx);
    const firecrawl = await caller.jobs.providerEvent({ provider: "firecrawl", externalId: "crawl_demo_docs_001", status: "succeeded" });
    const apify = await caller.jobs.providerEvent({ provider: "apify", externalId: "run_demo_leads_001", status: "failed", message: "Memory limit" });
    expect(firecrawl.job?.provider).toBe("firecrawl");
    expect(apify.job?.errorMessage).toBe("Memory limit");
  });

  it("blocks job recovery until explicit approval", async () => {
    const caller = appRouter.createCaller(ctx);
    simulateJobFailure("job-apify-leads");
    await expect(caller.jobs.remediate({ id: "job-apify-leads", action: "retry", confirmation: "APPROVE" })).resolves.toMatchObject({ status: "running" });
    expect(getJob("job-apify-leads")?.status).toBe("running");
  });
});
