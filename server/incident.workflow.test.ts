import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [
      {
        message: {
          content: JSON.stringify({
            severity: "Critical",
            explanation: "The payment API is unavailable and the error rate indicates broad customer impact.",
            recommendedAction: "Restart the mock payment service after explicit approval.",
            confidence: 0.97,
          }),
        },
      },
    ],
  })),
}));

import { appRouter } from "./routers";
import { getServiceStatus, setServiceStatus } from "./incidentEngine";

const ctx = {
  user: null,
  req: {} as never,
  res: {} as never,
};

describe("incident response workflow", () => {
  beforeEach(() => {
    setServiceStatus("healthy");
  });

  it("returns the mock payment service health as a JSON-compatible status", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.service.simulateFailure();
    expect(getServiceStatus()).toBe("unhealthy");
    expect(await caller.service.status()).toEqual({ service: "payment-service", status: "unhealthy" });
  });

  it("creates a five-field alert and grounds the AI decision in a runbook", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.service.simulateFailure();
    const incident = await caller.incidents.create();
    expect(incident.alert).toMatchObject({
      serviceName: "payment-service",
      severity: "Critical",
      errorRate: 0.85,
      affectedUsers: 320,
    });
    expect(typeof incident.alert.timestamp).toBe("string");
    expect(incident.classification.severity).toBe("Critical");
    expect(incident.runbook.title).toBe("Payment Service Failure");
    expect(incident.status).toBe("Awaiting approval");
  });

  it("requires explicit approval before remediation and records a Markdown post-mortem", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.service.simulateFailure();
    const incident = await caller.incidents.create();
    await expect(caller.incidents.approveRemediation({ id: incident.id, confirmation: "approve" as "APPROVE" })).rejects.toThrow();
    expect((await caller.incidents.get({ id: incident.id })).status).toBe("Awaiting approval");

    await caller.incidents.triggerVoiceAlert({ id: incident.id });
    const resolved = await caller.incidents.approveRemediation({ id: incident.id, confirmation: "APPROVE" });
    expect(resolved.status).toBe("Resolved");
    expect(resolved.omnidim.status).toBe("dispatch-ready");
    expect(resolved.postMortemMarkdown).toContain("# ");
    expect(resolved.postMortemMarkdown).toContain("## Follow-up items");
    expect(getServiceStatus()).toBe("healthy");
  });
});
