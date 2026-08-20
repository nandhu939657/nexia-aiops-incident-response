import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ status: "healthy" as "healthy" | "unhealthy", incidents: new Map<string, { id: string; status: string }>(), nextId: 1 }));
vi.mock("./incidentEngine", () => ({
  getServiceStatus: () => mockState.status,
  getPaymentHealthResponse: () => ({ service: "payment-service", status: mockState.status }),
  getIncident: (id: string) => mockState.incidents.get(id),
  createIncident: async () => { const incident = { id: `INC-${mockState.nextId++}`, status: "Awaiting approval" }; mockState.incidents.set(incident.id, incident); return incident; },
}));

import { getPaymentMonitorState, runPaymentMonitor } from "./paymentMonitor";

describe("payment scheduled monitor", () => {
  beforeEach(() => { mockState.status = "healthy"; mockState.incidents.clear(); mockState.nextId = 1; });

  it("records a healthy check", async () => {
    const result = await runPaymentMonitor("manual");
    expect(result.action).toBe("recorded");
    expect(result.status).toBe("healthy");
  });

  it("creates one incident and deduplicates repeated unhealthy checks", async () => {
    mockState.status = "unhealthy";
    const first = await runPaymentMonitor("scheduled");
    const second = await runPaymentMonitor("scheduled");
    expect(first.action).toBe("unhealthy-observation");
    expect(second.action).toBe("incident-created");
    expect(getPaymentMonitorState().consecutiveUnhealthy).toBe(2);
  });

  it("resets the unhealthy streak after recovery", async () => {
    mockState.status = "unhealthy";
    await runPaymentMonitor("scheduled");
    mockState.status = "healthy";
    const recovered = await runPaymentMonitor("scheduled");
    expect(recovered.action).toBe("recorded");
    expect(getPaymentMonitorState().consecutiveUnhealthy).toBe(0);
  });
});
