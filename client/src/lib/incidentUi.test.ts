import { describe, expect, it } from "vitest";
import { canApprove, incidentHeadline, severityTone } from "./incidentUi";

describe("incident dashboard UI policy", () => {
  it("only enables approval for the exact approval state and phrase", () => {
    expect(canApprove("Awaiting approval", "APPROVE")).toBe(true);
    expect(canApprove("Awaiting approval", "approve")).toBe(false);
    expect(canApprove("Resolved", "APPROVE")).toBe(false);
  });

  it("preserves the exact severity taxonomy", () => {
    expect(severityTone("Critical")).toBe("critical");
    expect(severityTone("Warning")).toBe("warning");
    expect(severityTone("Informational")).toBe("informational");
  });

  it("formats the incident headline for the history list", () => {
    expect(incidentHeadline("INC-001", "payment-service")).toBe("INC-001 · payment-service");
  });
});
