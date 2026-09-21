import { and, desc, eq } from "drizzle-orm";
import { monitorConfigurations, monitorChecks, type MonitorConfiguration } from "../drizzle/schema";
import { getDb } from "./db";
import { createIncidentFromAlert, getIncident, type Alert } from "./incidentEngine";
import type { UrlCheckBundle } from "./urlMonitor";

export type MonitorConfigInput = {
  name: string;
  applicationUrl: string;
  healthUrl?: string;
  cronExpression: string;
  timezone: string;
  runbookMarkdown: string;
  responseMode: "dashboard" | "email" | "omnidim";
  responseContact?: string;
  failureThreshold: number;
  approvedAction: string;
};

export async function listMonitorConfigurations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(monitorConfigurations).where(eq(monitorConfigurations.userId, userId));
}

export async function getMonitorConfiguration(id: number, userId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = userId === undefined ? eq(monitorConfigurations.id, id) : and(eq(monitorConfigurations.id, id), eq(monitorConfigurations.userId, userId));
  const rows = await db.select().from(monitorConfigurations).where(conditions).limit(1);
  return rows[0];
}

export async function getMonitorConfigurationByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(monitorConfigurations).where(eq(monitorConfigurations.cronTaskUid, taskUid)).limit(1);
  return rows[0];
}

export async function createMonitorConfiguration(userId: number, input: MonitorConfigInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const inserted = await db.insert(monitorConfigurations).values({
    userId,
    name: input.name,
    applicationUrl: input.applicationUrl,
    healthUrl: input.healthUrl || null,
    cronExpression: input.cronExpression,
    timezone: input.timezone,
    runbookMarkdown: input.runbookMarkdown,
    responseMode: input.responseMode,
    responseContact: input.responseContact || null,
    failureThreshold: input.failureThreshold,
    approvedAction: input.approvedAction,
  }).returning({ id: monitorConfigurations.id });
  return getMonitorConfiguration(inserted[0].id, userId);
}

export async function updateMonitorConfiguration(id: number, userId: number, input: Partial<MonitorConfigInput> & { enabled?: boolean; cronTaskUid?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const update: Record<string, unknown> = { ...input };
  if (update.healthUrl === "") update.healthUrl = null;
  if (update.responseContact === "") update.responseContact = null;
  if (input.enabled !== undefined) update.enabled = input.enabled ? 1 : 0;
  await db.update(monitorConfigurations).set(update).where(and(eq(monitorConfigurations.id, id), eq(monitorConfigurations.userId, userId)));
  return getMonitorConfiguration(id, userId);
}

export async function deleteMonitorConfiguration(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(monitorConfigurations).where(and(eq(monitorConfigurations.id, id), eq(monitorConfigurations.userId, userId)));
  return { ok: true };
}

export async function listMonitorChecks(monitorConfigurationId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(monitorChecks)
    .where(eq(monitorChecks.monitorConfigurationId, monitorConfigurationId))
    .orderBy(desc(monitorChecks.checkedAt))
    .limit(limit);
}

/**
 * Persists a check result to the timeline, updates the monitor's rolling
 * failure streak, and opens an incident once the configured failure
 * threshold is reached (deduplicated while an incident is still open).
 */
export async function recordMonitorCheckResult(config: MonitorConfiguration, bundle: UrlCheckBundle, source: "scheduled" | "manual") {
  const db = await getDb();
  if (!db) return { overall: bundle.overall, incidentCreated: false };

  const status: "healthy" | "unhealthy" | "unreachable" | "degraded" = bundle.overall === "unreachable" ? "unreachable" : bundle.overall === "healthy" ? "healthy" : "degraded";
  const detail = `${bundle.overall}: ${bundle.application.detail}${bundle.health ? `; health: ${bundle.health.detail}` : ""}`;

  let consecutiveFailures = config.consecutiveFailures;
  let activeIncidentId = config.activeIncidentId ?? undefined;
  let incidentCreated = false;

  if (bundle.overall === "healthy") {
    consecutiveFailures = 0;
    if (activeIncidentId && getIncident(activeIncidentId)?.status === "Resolved") activeIncidentId = undefined;
  } else {
    consecutiveFailures += 1;
    const openIncident = activeIncidentId ? getIncident(activeIncidentId) : undefined;
    if (openIncident && openIncident.status !== "Resolved") {
      // Already tracking an open incident for this monitor; avoid creating duplicates.
    } else if (consecutiveFailures >= config.failureThreshold) {
      const alert: Alert = {
        serviceName: config.name,
        severity: bundle.overall === "unreachable" ? "Critical" : "Warning",
        errorRate: bundle.application.ok ? 0 : 1,
        affectedUsers: 0,
        timestamp: bundle.checkedAt,
        alertType: bundle.overall === "unreachable" ? "url_unreachable" : "url_degraded",
        message: detail,
      };
      const incident = await createIncidentFromAlert(alert, { title: config.name, action: config.approvedAction, markdown: config.runbookMarkdown });
      activeIncidentId = incident.id;
      incidentCreated = true;
    }
  }

  await db
    .insert(monitorChecks)
    .values({
      monitorConfigurationId: config.id,
      checkedAt: new Date(bundle.checkedAt),
      source,
      overall: bundle.overall,
      applicationOk: bundle.application.ok ? 1 : 0,
      applicationStatusCode: bundle.application.statusCode,
      applicationLatencyMs: bundle.application.latencyMs,
      applicationDetail: bundle.application.detail,
      healthOk: bundle.health ? (bundle.health.ok ? 1 : 0) : null,
      healthStatusCode: bundle.health?.statusCode,
      healthLatencyMs: bundle.health?.latencyMs,
      healthDetail: bundle.health?.detail,
      incidentId: incidentCreated ? activeIncidentId : null,
    });

  await db
    .update(monitorConfigurations)
    .set({ lastCheckedAt: new Date(), lastStatus: status, lastResult: detail, consecutiveFailures, activeIncidentId: activeIncidentId ?? null })
    .where(eq(monitorConfigurations.id, config.id));

  return { overall: bundle.overall, incidentCreated, incidentId: activeIncidentId };
}
