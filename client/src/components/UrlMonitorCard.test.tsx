// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mutationResult = {
  checkedAt: "2026-08-21T10:00:00.000Z",
  overall: "healthy" as const,
  application: { url: "https://example.com/", ok: true, reachable: true, statusCode: 200, latencyMs: 42, detail: "OK" },
  health: { url: "https://example.com/health", ok: true, reachable: true, statusCode: 200, latencyMs: 18, detail: "OK", healthStatus: "healthy" },
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    monitoring: {
      testPresets: { useQuery: () => ({ data: [] }) },
      checkUrls: { useMutation: (options: { onSuccess: (value: typeof mutationResult) => void }) => ({ isPending: false, mutate: () => options.onSuccess(mutationResult) }) },
    },
  },
}));

import { UrlMonitorCard } from "./UrlMonitorCard";

describe("UrlMonitorCard", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("submits a check, shows session history, and opens the selected status", () => {
    render(<UrlMonitorCard />);
    fireEvent.change(screen.getByPlaceholderText("https://example.com"), { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /submit and check/i }));
    expect(screen.getByText("Recently checked URLs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view status/i })).toBeInTheDocument();
    expect(screen.getByText("Application is healthy")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /view status/i }));
    expect(screen.getByText("Selected check status")).toBeInTheDocument();
    expect(screen.getByText("HTTP 200 · 42ms")).toBeInTheDocument();
  });
});
