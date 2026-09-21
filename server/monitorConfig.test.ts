import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  incidents: new Map<string, { id: string; status: string }>(),
  nextIncidentId: 1,
}));

vi.mock("./incidentEngine", () => ({
  getIncident: (id: string) => mockState.incidents.get(id),
  createIncidentFromAlert: vi.fn(async () => {
    const incident = { id: `INC-${mockState.nextIncidentId++}`, status: "Awaiting approval" };
    mockState.incidents.set(incident.id, incident);
    return incident;
  }),
}));

const insertValues = vi.fn();
const updateSets: Record<string, unknown>[] = [];
vi.mock("./db", () => ({
  getDb: async () => ({
    insert: () => ({ values: (row: Record<string, unknown>) => { insertValues(row); return Promise.resolve(); } }),
    update: () => ({ set: (patch: Record<string, unknown>) => ({ where: () => { updateSets.push(patch); return Promise.resolve(); } }) }),
    select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => Promise.resolve([]) }) }) }) }),
  }),
}));

import { createIncidentFromAlert } from "./incidentEngine";
import { recordMonitorCheckResult } from "./monitorConfig";
import type { MonitorConfiguration } from "../drizzle/schema";
import type { UrlCheckBundle } from "./urlMonitor";

function baseConfig(overrides: Partial<MonitorConfiguration> = {}): MonitorConfiguration {
  return {
    id: 1,
    userId: 1,
    name: "My app",
    applicationUrl: "https://example.com",
    healthUrl: null,
    cronTaskUid: null,
    cronExpression: "0 * * * * *",
    timezone: "UTC",
    runbookMarkdown: "# Steps\n1. Investigate.",
    responseMode: "dashboard",
    responseContact: null,
    failureThreshold: 2,
    approvedAction: "Restart the application after approval.",
    enabled: 1,
    lastCheckedAt: null,
    lastStatus: null,
    lastResult: null,
    consecutiveFailures: 0,
    activeIncidentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as MonitorConfiguration;
}

function bundle(overall: UrlCheckBundle["overall"]): UrlCheckBundle {
  return {
    checkedAt: new Date().toISOString(),
    application: { url: "https://example.com", ok: overall === "healthy", reachable: overall !== "unreachable", statusCode: overall === "unreachable" ? undefined : 500, latencyMs: 120, detail: overall === "healthy" ? "Endpoint responded successfully" : "Endpoint returned HTTP 500" },
    overall,
  };
}

describe("recordMonitorCheckResult", () => {
  beforeEach(() => {
    mockState.incidents.clear();
    mockState.nextIncidentId = 1;
    insertValues.mockClear();
    updateSets.length = 0;
    vi.mocked(createIncidentFromAlert).mockClear();
  });

  it("does not create an incident before the failure threshold is reached", async () => {
    const result = await recordMonitorCheckResult(baseConfig(), bundle("unreachable"), "scheduled");
    expect(result.incidentCreated).toBe(false);
    expect(updateSets[0].consecutiveFailures).toBe(1);
    expect(createIncidentFromAlert).not.toHaveBeenCalled();
  });

  it("creates one incident once the threshold is reached and dedupes further failures while it stays open", async () => {
    const first = await recordMonitorCheckResult(baseConfig({ consecutiveFailures: 1 }), bundle("unreachable"), "scheduled");
    expect(first.incidentCreated).toBe(true);
    expect(createIncidentFromAlert).toHaveBeenCalledTimes(1);

    const second = await recordMonitorCheckResult(baseConfig({ consecutiveFailures: 2, activeIncidentId: first.incidentId }), bundle("unreachable"), "scheduled");
    expect(second.incidentCreated).toBe(false);
    expect(createIncidentFromAlert).toHaveBeenCalledTimes(1);
  });

  it("resets the failure streak and clears a resolved incident after a healthy check", async () => {
    mockState.incidents.set("INC-1", { id: "INC-1", status: "Resolved" });
    const result = await recordMonitorCheckResult(baseConfig({ consecutiveFailures: 3, activeIncidentId: "INC-1" }), bundle("healthy"), "scheduled");
    expect(result.overall).toBe("healthy");
    expect(updateSets[0].consecutiveFailures).toBe(0);
    expect(updateSets[0].activeIncidentId).toBeNull();
  });

  it("opens a new incident again if the previous one already resolved and failures reoccur", async () => {
    mockState.incidents.set("INC-1", { id: "INC-1", status: "Resolved" });
    const result = await recordMonitorCheckResult(baseConfig({ consecutiveFailures: 2, activeIncidentId: "INC-1" }), bundle("degraded"), "scheduled");
    expect(result.incidentCreated).toBe(true);
    expect(createIncidentFromAlert).toHaveBeenCalledTimes(1);
  });
});
