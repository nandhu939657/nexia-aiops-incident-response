import { describe, expect, it } from "vitest";
import { parsePaymentHealthPayload, serializePaymentHealthPayload } from "./paymentHealth";

describe("payment health JSON contract", () => {
  it("accepts healthy and unhealthy payloads", () => {
    expect(parsePaymentHealthPayload({ service: "payment-service", status: "healthy" }).status).toBe("healthy");
    expect(parsePaymentHealthPayload(JSON.parse(serializePaymentHealthPayload({ service: "payment-service", status: "unhealthy" }))).status).toBe("unhealthy");
  });

  it("rejects malformed or unexpected responses", () => {
    expect(() => parsePaymentHealthPayload({ service: "other-service", status: "healthy" })).toThrow("invalid service");
    expect(() => parsePaymentHealthPayload({ service: "payment-service", status: "degraded" })).toThrow("invalid status");
    expect(() => parsePaymentHealthPayload("healthy")).toThrow("JSON object");
  });
});
