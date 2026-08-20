import { createIncident, getIncident, getPaymentHealthResponse } from "./incidentEngine";
import { parsePaymentHealthPayload, serializePaymentHealthPayload } from "./paymentHealth";

export type PaymentMonitorState = {
  lastCheckedAt?: string;
  lastStatus?: "healthy" | "unhealthy";
  totalRuns: number;
  consecutiveUnhealthy: number;
  activeIncidentId?: string;
  lastResult?: string;
};

const state: PaymentMonitorState = { totalRuns: 0, consecutiveUnhealthy: 0 };

export function getPaymentMonitorState() {
  return { ...state };
}

export async function runPaymentMonitor(source: "scheduled" | "manual" = "manual") {
  const checkedAt = new Date().toISOString();
  const healthPayload = parsePaymentHealthPayload(JSON.parse(serializePaymentHealthPayload(getPaymentHealthResponse())));
  const status = healthPayload.status;
  state.totalRuns += 1;
  state.lastCheckedAt = checkedAt;
  state.lastStatus = status;

  if (status === "healthy") {
    state.consecutiveUnhealthy = 0;
    if (state.activeIncidentId && getIncident(state.activeIncidentId)?.status === "Resolved") state.activeIncidentId = undefined;
    state.lastResult = "healthy";
    return { ok: true, source, checkedAt, service: healthPayload.service, status, action: "recorded", health: healthPayload, state: getPaymentMonitorState() };
  }

  state.consecutiveUnhealthy += 1;
  if (state.activeIncidentId) {
    const incident = getIncident(state.activeIncidentId);
    if (incident && incident.status !== "Resolved") {
      state.lastResult = "deduplicated";
      return { ok: true, source, checkedAt, service: healthPayload.service, status, action: "deduplicated", health: healthPayload, incident, state: getPaymentMonitorState() };
    }
  }

  if (state.consecutiveUnhealthy < 2) {
    state.lastResult = "unhealthy-observation";
    return { ok: true, source, checkedAt, service: healthPayload.service, status, action: "unhealthy-observation", health: healthPayload, state: getPaymentMonitorState() };
  }

  const incident = await createIncident();
  state.activeIncidentId = incident.id;
  state.lastResult = "incident-created";
  return { ok: true, source, checkedAt, service: healthPayload.service, status, action: "incident-created", health: healthPayload, incident, state: getPaymentMonitorState() };
}
