export type UiSeverity = "Critical" | "Warning" | "Informational";

export function canApprove(incidentStatus: string, confirmation: string) {
  return incidentStatus === "Awaiting approval" && confirmation === "APPROVE";
}

export function severityTone(severity: UiSeverity) {
  if (severity === "Critical") return "critical";
  if (severity === "Warning") return "warning";
  return "informational";
}

export function incidentHeadline(id: string, serviceName: string) {
  return `${id} · ${serviceName}`;
}
