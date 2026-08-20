export type PaymentHealthPayload = {
  service: "payment-service";
  status: "healthy" | "unhealthy";
};

export function parsePaymentHealthPayload(value: unknown): PaymentHealthPayload {
  if (!value || typeof value !== "object") throw new Error("Payment health response must be a JSON object");
  const payload = value as Record<string, unknown>;
  if (payload.service !== "payment-service") throw new Error("Payment health response has an invalid service");
  if (payload.status !== "healthy" && payload.status !== "unhealthy") throw new Error("Payment health response has an invalid status");
  return { service: "payment-service", status: payload.status };
}

export function serializePaymentHealthPayload(payload: PaymentHealthPayload): string {
  return JSON.stringify(payload);
}
