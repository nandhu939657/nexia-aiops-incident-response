// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("exposes the separate operations workspaces and page content", () => {
    render(<AppShell><div>Page content</div></AppShell>);
    expect(screen.getByRole("link", { name: /Overview/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Incidents/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Runbooks/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Activity log/ })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Settings/ }).length).toBeGreaterThan(0);
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});
