import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const monitorConfigurations = mysqlTable("monitor_configurations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  applicationUrl: text("applicationUrl").notNull(),
  healthUrl: text("healthUrl"),
  cronTaskUid: varchar("cronTaskUid", { length: 65 }),
  cronExpression: varchar("cronExpression", { length: 64 }).notNull().default("0 * * * * *"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
  runbookMarkdown: text("runbookMarkdown").notNull(),
  responseMode: mysqlEnum("responseMode", ["dashboard", "email", "omnidim"]).notNull().default("dashboard"),
  responseContact: varchar("responseContact", { length: 320 }),
  failureThreshold: int("failureThreshold").notNull().default(2),
  approvedAction: varchar("approvedAction", { length: 180 }).notNull().default("Review the incident and restore the service after approval."),
  enabled: int("enabled").notNull().default(1),
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastStatus: mysqlEnum("lastStatus", ["healthy", "unhealthy", "unreachable", "degraded"]),
  lastResult: text("lastResult"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userIdx: index("monitor_configurations_user_idx").on(table.userId),
  cronIdx: index("monitor_configurations_cron_idx").on(table.cronTaskUid),
}));

export type MonitorConfiguration = typeof monitorConfigurations.$inferSelect;
export type InsertMonitorConfiguration = typeof monitorConfigurations.$inferInsert;
