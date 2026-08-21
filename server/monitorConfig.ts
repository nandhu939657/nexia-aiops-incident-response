import { and, eq } from "drizzle-orm";
import { monitorConfigurations } from "../drizzle/schema";
import { getDb } from "./db";

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
  });
  return getMonitorConfiguration(Number(inserted[0].insertId), userId);
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

export async function recordMonitorCheck(id: number, result: { status: "healthy" | "unhealthy" | "unreachable" | "degraded"; detail: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(monitorConfigurations).set({ lastCheckedAt: new Date(), lastStatus: result.status, lastResult: result.detail }).where(eq(monitorConfigurations.id, id));
}
