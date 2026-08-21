import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookie } from "cookie";
import { createHeartbeatJob, deleteHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { protectedProcedure } from "./_core/trpc";
import { createMonitorConfiguration, deleteMonitorConfiguration, getMonitorConfiguration, listMonitorConfigurations, updateMonitorConfiguration } from "./monitorConfig";
import { getPaymentMonitorState, runPaymentMonitor } from "./paymentMonitor";
import { checkConfiguredUrls, URL_TEST_PRESETS } from "./urlMonitor";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  approveRemediation,
  createIncident,
  getIncident,
  getServiceStatus,
  listIncidents,
  listRunbooks,
  setServiceStatus,
  triggerVoiceAlert,
  dispatchOmniDim,
  listJobs,
  getJob,
  heartbeatJob,
  ingestProviderEvent,
  simulateJobFailure,
  remediateJob,
  providerConnectionStatus,
  refreshProviderJob,
} from "./incidentEngine";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  service: router({
    status: publicProcedure.query(() => ({ service: "payment-service", status: getServiceStatus() })),
    restore: publicProcedure.mutation(() => setServiceStatus("healthy")),
    simulateFailure: publicProcedure.mutation(() => setServiceStatus("unhealthy")),
  }),
  incidents: router({
    list: publicProcedure.query(() => listIncidents()),
    get: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
      const incident = getIncident(input.id);
      if (!incident) throw new Error("Incident not found");
      return incident;
    }),
    create: publicProcedure.mutation(() => createIncident()),
    triggerVoiceAlert: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        const incident = triggerVoiceAlert(input.id);
        const dispatch = await dispatchOmniDim({
          agent_id: process.env.OMNIDIM_AGENT_ID,
          phone_number: process.env.OMNIDIM_PHONE_NUMBER,
          call_context: incident.omnidim.callContext,
        });
        return { incident, dispatch };
      }),
    approveRemediation: publicProcedure
      .input(z.object({ id: z.string(), confirmation: z.literal("APPROVE") }))
      .mutation(({ input }) => approveRemediation(input.id)),
  }),
  runbooks: router({
    list: publicProcedure.query(() => listRunbooks()),
  }),
  monitoring: router({
    testPresets: publicProcedure.query(() => URL_TEST_PRESETS),
    checkUrls: publicProcedure.input(z.object({ applicationUrl: z.string().min(1), healthUrl: z.string().optional() })).mutation(({ input }) => checkConfiguredUrls(input.applicationUrl, input.healthUrl)),
    list: protectedProcedure.query(({ ctx }) => listMonitorConfigurations(ctx.user.id)),
    create: protectedProcedure.input(z.object({ name: z.string().min(1).max(120), applicationUrl: z.string().url(), healthUrl: z.string().url().optional(), cronExpression: z.string().min(1), timezone: z.string().min(1).max(64), runbookMarkdown: z.string().min(1).max(8000), responseMode: z.enum(["dashboard", "email", "omnidim"]), responseContact: z.string().max(320).optional(), failureThreshold: z.number().int().min(1).max(10), approvedAction: z.string().min(1).max(180) })).mutation(async ({ input, ctx }) => {
      const config = await createMonitorConfiguration(ctx.user.id, input);
      if (!config) throw new Error("Monitor configuration could not be created");
      const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const heartbeat = await createHeartbeatJob({ name: `nexia-monitor-${config.id}`, cron: config.cronExpression, path: "/api/scheduled/user-monitor", payload: { monitorId: config.id }, description: `Nexia monitor for ${config.name}` }, session);
      return updateMonitorConfiguration(config.id, ctx.user.id, { cronTaskUid: heartbeat.taskUid });
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int(), name: z.string().min(1).max(120).optional(), applicationUrl: z.string().url().optional(), healthUrl: z.string().url().optional(), cronExpression: z.string().min(1).optional(), timezone: z.string().min(1).max(64).optional(), runbookMarkdown: z.string().min(1).max(8000).optional(), responseMode: z.enum(["dashboard", "email", "omnidim"]).optional(), responseContact: z.string().max(320).optional(), failureThreshold: z.number().int().min(1).max(10).optional(), approvedAction: z.string().min(1).max(180).optional(), enabled: z.boolean().optional() })).mutation(async ({ input, ctx }) => {
      const current = await getMonitorConfiguration(input.id, ctx.user.id);
      if (!current) throw new Error("Monitor configuration not found");
      const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      if (current.cronTaskUid && (input.cronExpression || input.enabled !== undefined)) await updateHeartbeatJob(current.cronTaskUid, { cron: input.cronExpression, enable: input.enabled }, session);
      const { id, ...patch } = input;
      return updateMonitorConfiguration(id, ctx.user.id, patch);
    }),
    pause: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input, ctx }) => {
      const current = await getMonitorConfiguration(input.id, ctx.user.id);
      if (!current?.cronTaskUid) throw new Error("Monitor schedule not found");
      const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      await updateHeartbeatJob(current.cronTaskUid, { enable: false }, session);
      return updateMonitorConfiguration(input.id, ctx.user.id, { enabled: false });
    }),
    resume: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input, ctx }) => {
      const current = await getMonitorConfiguration(input.id, ctx.user.id);
      if (!current?.cronTaskUid) throw new Error("Monitor schedule not found");
      const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      await updateHeartbeatJob(current.cronTaskUid, { enable: true }, session);
      return updateMonitorConfiguration(input.id, ctx.user.id, { enabled: true });
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input, ctx }) => {
      const current = await getMonitorConfiguration(input.id, ctx.user.id);
      if (current?.cronTaskUid) { const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? ""; await deleteHeartbeatJob(current.cronTaskUid, session); }
      return deleteMonitorConfiguration(input.id, ctx.user.id);
    }),
    checkSaved: protectedProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input, ctx }) => {
      const config = await getMonitorConfiguration(input.id, ctx.user.id);
      if (!config) throw new Error("Monitor configuration not found");
      return checkConfiguredUrls(config.applicationUrl, config.healthUrl ?? undefined);
    }),
  }),
  jobs: router({
    list: publicProcedure.query(() => listJobs()),
    get: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
      const job = getJob(input.id);
      if (!job) throw new Error("Monitored job not found");
      return job;
    }),
    heartbeat: publicProcedure.input(z.object({ id: z.string(), status: z.enum(["healthy", "running", "succeeded", "failed", "stale", "paused"]).optional(), durationMs: z.number().optional(), externalId: z.string().optional(), metadata: z.record(z.string(), z.string()).optional() })).mutation(({ input }) => heartbeatJob(input)),
    providerEvent: publicProcedure.input(z.object({ provider: z.enum(["firecrawl", "apify", "generic-webhook", "internal"]), jobId: z.string().optional(), externalId: z.string().optional(), status: z.enum(["healthy", "running", "succeeded", "failed", "stale", "paused"]), message: z.string().optional(), durationMs: z.number().optional() })).mutation(({ input }) => ingestProviderEvent(input.provider, input)),
    simulateFailure: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => simulateJobFailure(input.id)),
    remediate: publicProcedure.input(z.object({ id: z.string(), action: z.enum(["retry", "pause", "replay"]), confirmation: z.literal("APPROVE") })).mutation(({ input }) => remediateJob(input.id, input.action, input.confirmation)),
    refresh: publicProcedure.input(z.object({ id: z.string() })).mutation(({ input }) => refreshProviderJob(input.id)),
    providers: publicProcedure.query(() => providerConnectionStatus()),
    monitorStatus: publicProcedure.query(() => getPaymentMonitorState()),
    runPaymentMonitor: publicProcedure.mutation(() => runPaymentMonitor("manual")),
  }),
});

export type AppRouter = typeof appRouter;
