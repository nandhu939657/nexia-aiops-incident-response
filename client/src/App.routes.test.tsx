// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  window.matchMedia = window.matchMedia || (() => ({ matches: false, media: "", onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) as typeof window.matchMedia;
});

const runbook = { id: "payment-service-failure", title: "Payment Service Failure", incidentType: "health_check_failed", severity: "Critical" as const, action: "Restart after approval", markdown: "# Payment Service Failure" };
const baseIncident = { id: "INC-001", alert: { serviceName: "payment-service", severity: "Critical" as const, errorRate: 0.85, affectedUsers: 320, timestamp: "2026-08-20T10:00:00.000Z", alertType: "health_check_failed", message: "Payment API is not responding" }, classification: { severity: "Critical" as const, explanation: "Payment API is unavailable.", recommendedAction: "Restart after approval.", confidence: 0.97 }, runbook, status: "Awaiting approval" as const, approvalRequired: true as const, omnidim: { mode: "simulated" as const, status: "not-triggered" as const, callContext: "Critical incident" }, createdAt: "2026-08-20T10:00:00.000Z" };
let workflowIncident: any = { ...baseIncident };

vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ service: { status: { invalidate: vi.fn() } }, incidents: { list: { invalidate: vi.fn() }, get: { invalidate: vi.fn() } } }), service: { status: { useQuery: () => ({ data: { service: "payment-service", status: "healthy" } }) }, simulateFailure: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) }, restore: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } }, incidents: { list: { useQuery: () => ({ data: [workflowIncident] }) }, get: { useQuery: () => ({ data: workflowIncident, isLoading: false }) }, create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) }, triggerVoiceAlert: { useMutation: () => ({ mutateAsync: vi.fn(async () => ({ incident: workflowIncident, dispatch: { endpoint: "/api/v1/calls/dispatch" } })), isPending: false }) }, approveRemediation: { useMutation: () => ({ mutateAsync: vi.fn(async () => { workflowIncident = { ...workflowIncident, status: "Resolved", notification: "INCIDENT RESOLVED · payment-service", postMortemMarkdown: "# INC-001\n\n## Follow-up items\n- Review logs" }; return workflowIncident; }), isPending: false }) } }, runbooks: { list: { useQuery: () => ({ data: [runbook] }) } } } }));

import App from "./App";

afterEach(() => { cleanup(); workflowIncident = { ...baseIncident }; window.history.pushState({}, "", "/"); });

describe("App route map", () => {
  it.each([["/", "Overview"], ["/incidents", "Response queue"], ["/incidents/INC-001", "Incident detail"], ["/runbooks", "Knowledge base"], ["/activity", "Audit trail"], ["/settings", "Workspace configuration"]])("renders %s as %s", (path, heading) => { window.history.pushState({}, "", path); render(<App />); expect(screen.getAllByText(heading).length).toBeGreaterThan(0); });

  it("navigates from the incident queue to detail and completes the guarded workflow", async () => {
    window.history.pushState({}, "", "/incidents");
    const view = render(<App />);
    fireEvent.click(screen.getByRole("link", { name: /open detail page/i }));
    expect(screen.getByText("Incident detail")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve remediation/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /prepare omnidim call/i }));
    await waitFor(() => expect(screen.getByText(/OmniDim dispatch ready/)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("Type APPROVE"), { target: { value: "APPROVE" } });
    expect(screen.getByRole("button", { name: /approve remediation/i })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /approve remediation/i }));
    await waitFor(() => expect(workflowIncident.status).toBe("Resolved"));
    view.rerender(<App />);
    expect(screen.getByText("Incident resolved")).toBeInTheDocument();
    expect(screen.getByText(/INCIDENT RESOLVED/)).toBeInTheDocument();
    expect(screen.getByText(/## Follow-up items/)).toBeInTheDocument();
  });
});
