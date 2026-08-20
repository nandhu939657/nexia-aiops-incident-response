import { readFileSync } from "node:fs";
import { invokeLLM } from "./_core/llm";

export type ServiceStatus = "healthy" | "unhealthy";
export type Severity = "Critical" | "Warning" | "Informational";
export type IncidentStatus = "Investigating" | "Awaiting approval" | "Remediating" | "Resolved" | "Escalated";

export type Alert = {
  serviceName: string;
  severity: Severity;
  errorRate: number;
  affectedUsers: number;
  timestamp: string;
  alertType: string;
  message: string;
};

export type Runbook = {
  id: string;
  title: string;
  incidentType: string;
  severity: Severity;
  action: string;
  markdown: string;
  keywords: string[];
};

export type Incident = {
  id: string;
  alert: Alert;
  classification: {
    severity: Severity;
    explanation: string;
    recommendedAction: string;
    confidence: number;
  };
  runbook: Runbook;
  status: IncidentStatus;
  approvalRequired: true;
  approvedAt?: string;
  actionTaken?: string;
  actionResult?: string;
  notification?: string;
  postMortemMarkdown?: string;
  omnidim: {
    mode: "simulated" | "dispatch-ready";
    status: "not-triggered" | "simulated" | "dispatch-ready";
    callContext: string;
  };
  createdAt: string;
  resolvedAt?: string;
};

const embeddedRunbookMetadata: Runbook[] = [
  {
    id: "payment-service-failure",
    title: "Payment Service Failure",
    incidentType: "health_check_failed",
    severity: "Critical",
    action: "Restart the mock payment service after explicit approval.",
    keywords: ["payment", "unavailable", "health", "503", "checkout", "error"],
    markdown: `# Payment Service Failure\n\n**Service:** payment-service\n**Severity:** Critical\n\n## Symptoms\nThe payment API returns HTTP 503 responses, the health check is unhealthy, and the error rate is above 80%.\n\n## Checks\n1. Confirm the service health endpoint is unhealthy.\n2. Confirm the error signal has persisted across multiple checks.\n3. Check the incident timeline for a recent deployment or simulated failure.\n\n## Approved action\nRequest human approval, then restart the mock payment service once.\n\n## Prohibited actions\nDo not delete data, rotate credentials, or execute arbitrary commands.\n\n## Escalation\nEscalate if the service remains unhealthy after the approved restart.`,
  },
  {
    id: "high-cpu",
    title: "High CPU Utilisation",
    incidentType: "cpu_threshold",
    severity: "Warning",
    action: "Review traffic and recommend a capacity increase for approval.",
    keywords: ["cpu", "utilisation", "traffic", "capacity", "scale", "load"],
    markdown: `# High CPU Utilisation\n\n**Service:** application-service\n**Severity:** Warning\n\n## Symptoms\nCPU remains above 90% for ten minutes.\n\n## Approved action\nRecommend a capacity increase and require approval before changing capacity.\n\n## Escalation\nEscalate if latency continues to rise after capacity is increased.`,
  },
  {
    id: "repeated-crash",
    title: "Repeated Application Crash",
    incidentType: "restart_loop",
    severity: "Critical",
    action: "Stop automatic retries and escalate for root-cause investigation.",
    keywords: ["crash", "restart", "loop", "memory", "repeated", "failure"],
    markdown: `# Repeated Application Crash\n\n**Service:** application-service\n**Severity:** Critical\n\n## Symptoms\nThe same service restarts repeatedly within a short period.\n\n## Approved action\nDo not restart indefinitely. Stop retries and escalate with the incident timeline.\n\n## Follow-up\nInspect recent code changes, memory usage, and application logs.`,
  },
  {
    id: "high-error-rate",
    title: "High Error Rate",
    incidentType: "error_rate_threshold",
    severity: "Warning",
    action: "Inspect recent changes and request approval for a controlled rollback simulation.",
    keywords: ["error", "rate", "5xx", "deployment", "rollback", "requests"],
    markdown: `# High Error Rate\n\n**Service:** application-service\n**Severity:** Warning\n\n## Symptoms\nThe service returns an elevated proportion of 5xx responses.\n\n## Approved action\nInspect recent changes and request human approval before a rollback.\n\n## Escalation\nEscalate when customer impact is increasing or the rollback simulation fails.`,
  },
];

const runbookFiles: Record<string, string> = {
  "payment-service-failure": "./runbooks/payment-service-failure.md",
  "high-cpu": "./runbooks/high-cpu.md",
  "repeated-crash": "./runbooks/repeated-crash.md",
  "high-error-rate": "./runbooks/high-error-rate.md",
};

function parseFrontmatter(markdown: string) {
  const lines = markdown.split(String.fromCharCode(10)).map(line => line.replace(String.fromCharCode(13), ""));
  const end = lines.indexOf("---", 1);
  if (lines[0] !== "---" || end < 0) throw new Error("Runbook is missing frontmatter");
  return Object.fromEntries(
    lines.slice(1, end).map(line => {
      const separator = line.indexOf(":");
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }),
  );
}

const runbooks: Runbook[] = Object.entries(runbookFiles).map(([id, filename]) => {
  const markdown = readFileSync(new URL(filename, import.meta.url), "utf8");
  const fields = parseFrontmatter(markdown);
  return {
    id,
    title: fields.title,
    incidentType: fields.incidentType,
    severity: fields.severity as Severity,
    action: fields.action,
    keywords: fields.keywords.split(",").map(keyword => keyword.trim()),
    markdown,
  };
});

let serviceStatus: ServiceStatus = "healthy";
const incidents = new Map<string, Incident>();

function now() {
  return new Date().toISOString();
}

function searchRunbook(alert: Alert): Runbook {
  const query = `${alert.alertType} ${alert.message} ${alert.serviceName}`.toLowerCase();
  const ranked = runbooks
    .map(runbook => ({
      runbook,
      score: runbook.keywords.reduce((score, keyword) => score + (query.includes(keyword) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.runbook ?? runbooks[0];
}

async function classifyAlert(alert: Alert, runbook: Runbook) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an incident commander for a software operations team. Analyze the incident alert and return only the requested structured JSON. Severity must be exactly one of Critical, Warning, or Informational. Use the alert and runbook context; do not invent infrastructure actions.",
      },
      {
        role: "user",
        content: JSON.stringify({ alert, retrievedRunbook: runbook.markdown }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "incident_classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            severity: { type: "string", enum: ["Critical", "Warning", "Informational"] },
            explanation: { type: "string" },
            recommendedAction: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["severity", "explanation", "recommendedAction", "confidence"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("The classifier did not return structured content");
  const parsed = JSON.parse(content) as {
    severity: Severity;
    explanation: string;
    recommendedAction: string;
    confidence: number;
  };
  if (!["Critical", "Warning", "Informational"].includes(parsed.severity)) {
    throw new Error("The classifier returned an invalid severity");
  }
  return parsed;
}

export function getServiceStatus() {
  return serviceStatus;
}

export function setServiceStatus(status: ServiceStatus) {
  serviceStatus = status;
  return { service: "payment-service", status, checkedAt: now() };
}

export function listRunbooks() {
  return runbooks.map(({ keywords, ...runbook }) => runbook);
}

export function listIncidents() {
  return Array.from(incidents.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getIncident(id: string) {
  return incidents.get(id);
}

export async function createIncident() {
  const timestamp = now();
  const alert: Alert = {
    serviceName: "payment-service",
    severity: "Critical",
    errorRate: serviceStatus === "unhealthy" ? 0.85 : 0,
    affectedUsers: serviceStatus === "unhealthy" ? 320 : 0,
    timestamp,
    alertType: serviceStatus === "unhealthy" ? "health_check_failed" : "health_check_recovered",
    message: serviceStatus === "unhealthy" ? "Payment API is not responding" : "Payment API is healthy",
  };
  const runbook = searchRunbook(alert);
  const classification = await classifyAlert(alert, runbook);
  const id = `INC-${String(incidents.size + 1).padStart(3, "0")}`;
  const incident: Incident = {
    id,
    alert,
    classification,
    runbook,
    status: classification.severity === "Informational" ? "Resolved" : "Awaiting approval",
    approvalRequired: true,
    omnidim: {
      mode: "simulated",
      status: "not-triggered",
      callContext: `Critical incident ${id}. ${alert.serviceName} reports ${Math.round(alert.errorRate * 100)}% errors and ${alert.affectedUsers} affected users. Recommended action: ${classification.recommendedAction}`,
    },
    createdAt: timestamp,
  };
  incidents.set(id, incident);
  return incident;
}

export function triggerVoiceAlert(id: string) {
  const incident = incidents.get(id);
  if (!incident) throw new Error("Incident not found");
  incident.omnidim.status = "dispatch-ready";
  incident.omnidim.mode = "dispatch-ready";
  return incident;
}

export function approveRemediation(id: string) {
  const incident = incidents.get(id);
  if (!incident) throw new Error("Incident not found");
  if (incident.status !== "Awaiting approval") throw new Error("This incident is not awaiting approval");
  incident.status = "Remediating";
  incident.approvedAt = now();
  incident.actionTaken = incident.runbook.action;
  serviceStatus = "healthy";
  incident.actionResult = "Mock payment service restored successfully.";
  incident.status = "Resolved";
  incident.resolvedAt = now();
  incident.notification = [
    "INCIDENT RESOLVED",
    `Service: ${incident.alert.serviceName}`,
    `Severity: ${incident.classification.severity}`,
    `Runbook used: ${incident.runbook.title}`,
    `Action taken: ${incident.actionTaken}`,
    `Result: ${incident.actionResult}`,
    `Affected users: ${incident.alert.affectedUsers}`,
  ].join("\n");
  incident.postMortemMarkdown = `# ${incident.id} — ${incident.runbook.title}\n\n## Start time\n${incident.createdAt}\n\n## End time\n${incident.resolvedAt}\n\n## Impact summary\n${incident.alert.affectedUsers} demo users were affected by an ${Math.round(incident.alert.errorRate * 100)}% payment-service error rate.\n\n## Root-cause status\nUnder investigation; this academic simulation establishes the incident workflow and recovery path.\n\n## Action taken\n${incident.actionTaken}\n\n## Resolution\n${incident.actionResult}\n\n## Follow-up items\n- Review service logs and recent changes.\n- Validate the payment-service health check in a larger test set.\n- Keep remediation approval mandatory for any real infrastructure action.\n`;
  return incident;
}


export async function dispatchOmniDim(payload: { agent_id?: string; phone_number?: string; call_context: string }) {
  const baseUrl = process.env.OMNIDIM_BASE_URL;
  const apiKey = process.env.OMNIDIM_API_KEY;
  if (!baseUrl || !apiKey) {
    return {
      mode: "simulated" as const,
      endpoint: "/api/v1/calls/dispatch",
      status: "simulated" as const,
      message: "OmniDim credentials are not configured; dispatch was simulated safely.",
      payload,
    };
  }

  const response = await fetch(`${baseUrl}/api/v1/calls/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`OmniDim dispatch failed with ${response.status}: ${body}`);
  return { mode: "live" as const, endpoint: "/api/v1/calls/dispatch", status: "dispatched" as const, body };
}
