// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ service: { status: { invalidate: vi.fn() } }, incidents: { list: { invalidate: vi.fn() } } }),
    service: {
      status: { useQuery: () => ({ data: { service: "payment-service", status: "healthy" } }) },
      simulateFailure: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      restore: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
    },
    incidents: { list: { useQuery: () => ({ data: [] }) }, create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } },
  },
}));

import Home from "./Home";

describe("Overview page", () => {
  it("shows the service control plane and clear links to separate workspaces", () => {
    render(<Home />);
    expect(screen.getByText("Keep critical services calm under pressure.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /simulate incident/i })).toBeInTheDocument();
    expect(screen.getByText("Operate with context")).toBeInTheDocument();
    expect(screen.getByText("Review incidents")).toBeInTheDocument();
    expect(screen.getByText("Browse runbooks")).toBeInTheDocument();
  });
});
