// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

afterEach(() => { cleanup(); });

beforeAll(() => {
  window.ResizeObserver = window.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
});

const config = {
  id: 1,
  name: "Student task app",
  applicationUrl: "https://example.com",
  healthUrl: "https://example.com/health",
  cronExpression: "0 */5 * * * *",
  lastCheckedAt: "2026-08-21T10:05:00.000Z",
  lastStatus: "unreachable" as const,
  lastResult: "unreachable: Endpoint returned HTTP 503",
  consecutiveFailures: 2,
  failureThreshold: 2,
};

const checks = [
  { id: 2, monitorConfigurationId: 1, checkedAt: "2026-08-21T10:05:00.000Z", source: "scheduled", overall: "unreachable" as const, applicationOk: 0, applicationStatusCode: 503, applicationLatencyMs: 210, applicationDetail: "Endpoint returned HTTP 503", healthOk: 0, healthDetail: "Endpoint returned HTTP 503", incidentId: "INC-004" },
  { id: 1, monitorConfigurationId: 1, checkedAt: "2026-08-21T10:00:00.000Z", source: "scheduled", overall: "healthy" as const, applicationOk: 1, applicationStatusCode: 200, applicationLatencyMs: 88, applicationDetail: "Endpoint responded successfully", healthOk: 1, healthDetail: "Endpoint responded successfully", incidentId: null },
];

const checkSavedMutate = vi.fn();

vi.mock("wouter", async importOriginal => {
  const actual = await importOriginal<typeof import("wouter")>();
  return { ...actual, useParams: () => ({ id: "1" }) };
});

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: vi.fn(), setData: vi.fn() } } }),
    auth: { me: { useQuery: () => ({ data: { id: 1, openId: "test-user", email: "test@example.com", name: "Test User" }, isLoading: false }) } },
    monitoring: {
      history: { useQuery: () => ({ data: { config, checks }, isLoading: false, refetch: vi.fn() }) },
      checkSaved: { useMutation: (options: { onSuccess: (value: unknown) => void }) => ({ isPending: false, mutate: (input: unknown) => { checkSavedMutate(input); options.onSuccess({ overall: "healthy", incidentCreated: false }); } }) },
    },
  },
}));

import MonitorDetail from "./MonitorDetail";

describe("MonitorDetail", () => {
  beforeEach(() => { checkSavedMutate.mockClear(); });

  it("shows uptime, the check timeline, and a link to the incident opened from a failed check", () => {
    render(<MonitorDetail />);
    expect(screen.getByText("Student task app")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getAllByText("Unreachable").length).toBeGreaterThan(0);
    expect(screen.getByText("What's happening")).toBeInTheDocument();
    expect(screen.getByText("Endpoint returned HTTP 503")).toBeInTheDocument();
    expect(screen.getByText("Endpoint responded successfully")).toBeInTheDocument();
    const incidentLink = screen.getByRole("link", { name: /incident inc-004/i });
    expect(incidentLink).toHaveAttribute("href", "/incidents/INC-004");
  });

  it("triggers an immediate check from the timeline page", () => {
    render(<MonitorDetail />);
    fireEvent.click(screen.getByRole("button", { name: /check now/i }));
    expect(checkSavedMutate).toHaveBeenCalledWith({ id: 1 });
  });
});
