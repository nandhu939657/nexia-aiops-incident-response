// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const runbook = { id: "payment-service-failure", title: "Payment Service Failure", incidentType: "health_check_failed", severity: "Critical" as const, action: "Restart the mock payment service after explicit approval.", markdown: "# Payment Service Failure\n\n## Approved action\nRestart once after approval." };
const incident = { id: "INC-001", alert: { serviceName: "payment-service", severity: "Critical" as const, errorRate: 0.85, affectedUsers: 320, timestamp: "2026-08-20T10:00:00.000Z", alertType: "health_check_failed", message: "Payment API is not responding" }, classification: { severity: "Critical" as const, explanation: "The payment API is unavailable.", recommendedAction: "Restart after approval.", confidence: 0.97 }, runbook, status: "Awaiting approval" as const, approvalRequired: true as const, omnidim: { mode: "simulated" as const, status: "not-triggered" as const, callContext: "Critical incident" }, createdAt: "2026-08-20T10:00:00.000Z" };

vi.mock("wouter", async () => { const actual = await vi.importActual<typeof import("wouter")>("wouter"); return { ...actual, useParams: () => ({ id: "INC-001" }) }; });
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ incidents: { list: { invalidate: vi.fn() }, get: { invalidate: vi.fn() } }, service: { status: { invalidate: vi.fn() } } }), service: { status: { useQuery: () => ({ data: { service: "payment-service", status: "healthy" } }) } }, incidents: { list: { useQuery: () => ({ data: [incident] }) }, get: { useQuery: () => ({ data: incident, isLoading: false }) }, triggerVoiceAlert: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) }, approveRemediation: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } }, runbooks: { list: { useQuery: () => ({ data: [runbook] }) } }, jobs: { providers: { useQuery: () => ({ data: { internal: { configured: true }, firecrawl: { configured: false }, apify: { configured: false } } }) } } } }));

import Incidents from "./Incidents";
import IncidentDetail from "./IncidentDetail";
import Runbooks from "./Runbooks";
import Activity from "./Activity";
import Settings from "./Settings";

afterEach(() => cleanup());

describe("multi-page workspaces", () => {
  it("renders the searchable incident queue", () => { render(<Incidents />); expect(screen.getByText("Response queue")).toBeInTheDocument(); expect(screen.getByPlaceholderText(/Search by incident/)).toBeInTheDocument(); expect(screen.getAllByText("INC-001").length).toBeGreaterThan(0); });
  it("renders the dedicated incident detail contract", () => { render(<IncidentDetail />); expect(screen.getByText("Incident detail")).toBeInTheDocument(); expect(screen.getByText("Approval and action")).toBeInTheDocument(); expect(screen.getByText("Retrieved runbook")).toBeInTheDocument(); });
  it("renders the runbook reader, activity audit trail, and settings policy panels", () => { render(<Runbooks />); expect(screen.getByText("Markdown reader")).toBeInTheDocument(); cleanup(); render(<Activity />); expect(screen.getByText("Audit trail")).toBeInTheDocument(); cleanup(); render(<Settings />); expect(screen.getByText("Human approval required")).toBeInTheDocument(); });
});
