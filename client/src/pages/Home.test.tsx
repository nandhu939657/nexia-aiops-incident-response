// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const sampleIncident = {
  id: "INC-001",
  alert: {
    serviceName: "payment-service",
    severity: "Critical" as const,
    errorRate: 0.85,
    affectedUsers: 320,
    timestamp: "2026-08-20T10:00:00.000Z",
    alertType: "health_check_failed",
    message: "Payment API is not responding",
  },
  classification: {
    severity: "Critical" as const,
    explanation: "The payment API is unavailable and customer impact is broad.",
    recommendedAction: "Restart the mock payment service after explicit approval.",
    confidence: 0.97,
  },
  runbook: {
    id: "payment-service-failure",
    title: "Payment Service Failure",
    incidentType: "health_check_failed",
    severity: "Critical" as const,
    action: "Restart the mock payment service after explicit approval.",
    markdown: "# Payment Service Failure\n\n## Approved action\nRestart once after approval.",
  },
  status: "Awaiting approval" as const,
  approvalRequired: true as const,
  omnidim: { mode: "simulated" as const, status: "not-triggered" as const, callContext: "Critical incident" },
  createdAt: "2026-08-20T10:00:00.000Z",
};

let mockedIncidents: any[] = [sampleIncident];

vi.mock("@/lib/trpc", () => {
  const mutation = () => ({ mutateAsync: vi.fn(), isPending: false });
  return {
    trpc: {
      useUtils: () => ({ service: { status: { invalidate: vi.fn() } }, incidents: { list: { invalidate: vi.fn() } } }),
      service: { status: { useQuery: () => ({ data: { service: "payment-service", status: "unhealthy" } }) }, simulateFailure: { useMutation: mutation }, restore: { useMutation: mutation } },
      incidents: { list: { useQuery: () => ({ data: mockedIncidents }) }, create: { useMutation: mutation }, triggerVoiceAlert: { useMutation: mutation }, approveRemediation: { useMutation: mutation } },
      runbooks: { list: { useQuery: () => ({ data: [sampleIncident.runbook] }) } },
    },
  };
});

import Home from "./Home";

describe("Home incident decision view", () => {
  afterEach(() => {
    cleanup();
    mockedIncidents = [sampleIncident];
  });
  it("renders the retrieved runbook beside the AI decision and keeps approval locked until explicit confirmation", () => {
    render(<Home />);
    expect(screen.getByText("AI assessment")).toBeInTheDocument();
    expect(screen.getByText("Retrieved runbook")).toBeInTheDocument();
    expect(screen.getByText(/Approved action/)).toBeInTheDocument();

    const approveButton = screen.getByRole("button", { name: /approve/i });
    expect(approveButton).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Type APPROVE"), { target: { value: "APPROVE" } });
    expect(approveButton).toBeEnabled();
  });

  it("renders the Markdown post-mortem for a resolved incident", () => {
    mockedIncidents = [{ ...sampleIncident, status: "Resolved" as const, actionResult: "Mock payment service restored successfully.", notification: "INCIDENT RESOLVED", postMortemMarkdown: "# INC-001\\n\\n## Follow-up items\\n- Review logs" }];
    render(<Home />);
    expect(screen.getByText("Post-mortem detail")).toBeInTheDocument();
    expect(screen.getByText(/## Follow-up items/)).toBeInTheDocument();
    expect(screen.getByText("Notification sent")).toBeInTheDocument();
  });

  it("renders the empty post-mortem state when no incident is selected", () => {
    mockedIncidents = [];
    render(<Home />);
    expect(screen.getByText("No resolved incident record selected")).toBeInTheDocument();
  });
});
