import { index, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const monitorResponseModeEnum = pgEnum("monitor_response_mode", ["dashboard", "email", "omnidim"]);
export const monitorStatusEnum = pgEnum("monitor_status", ["healthy", "unhealthy", "unreachable", "degraded"]);

export const monitorConfigurations = pgTable("monitor_configurations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  applicationUrl: text("applicationUrl").notNull(),
  healthUrl: text("healthUrl"),
  cronTaskUid: varchar("cronTaskUid", { length: 65 }),
  cronExpression: varchar("cronExpression", { length: 64 }).notNull().default("0 * * * * *"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
  runbookMarkdown: text("runbookMarkdown").notNull(),
  responseMode: monitorResponseModeEnum("responseMode").notNull().default("dashboard"),
  responseContact: varchar("responseContact", { length: 320 }),
  failureThreshold: integer("failureThreshold").notNull().default(2),
  approvedAction: varchar("approvedAction", { length: 180 }).notNull().default("Review the incident and restore the service after approval."),
  enabled: integer("enabled").notNull().default(1),
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastStatus: monitorStatusEnum("lastStatus"),
  lastResult: text("lastResult"),
  consecutiveFailures: integer("consecutiveFailures").notNull().default(0),
  activeIncidentId: varchar("activeIncidentId", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, table => ({
  userIdx: index("monitor_configurations_user_idx").on(table.userId),
  cronIdx: index("monitor_configurations_cron_idx").on(table.cronTaskUid),
}));

export type MonitorConfiguration = typeof monitorConfigurations.$inferSelect;
export type InsertMonitorConfiguration = typeof monitorConfigurations.$inferInsert;

export const monitorCheckSourceEnum = pgEnum("monitor_check_source", ["scheduled", "manual"]);
export const monitorCheckOverallEnum = pgEnum("monitor_check_overall", ["healthy", "degraded", "unreachable"]);

export const monitorChecks = pgTable("monitor_checks", {
  id: serial("id").primaryKey(),
  monitorConfigurationId: integer("monitorConfigurationId").notNull(),
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
  source: monitorCheckSourceEnum("source").notNull().default("scheduled"),
  overall: monitorCheckOverallEnum("overall").notNull(),
  applicationOk: integer("applicationOk").notNull(),
  applicationStatusCode: integer("applicationStatusCode"),
  applicationLatencyMs: integer("applicationLatencyMs"),
  applicationDetail: text("applicationDetail"),
  healthOk: integer("healthOk"),
  healthStatusCode: integer("healthStatusCode"),
  healthLatencyMs: integer("healthLatencyMs"),
  healthDetail: text("healthDetail"),
  incidentId: varchar("incidentId", { length: 32 }),
}, table => ({
  configIdx: index("monitor_checks_config_idx").on(table.monitorConfigurationId, table.checkedAt),
}));

export type MonitorCheck = typeof monitorChecks.$inferSelect;
export type InsertMonitorCheck = typeof monitorChecks.$inferInsert;
