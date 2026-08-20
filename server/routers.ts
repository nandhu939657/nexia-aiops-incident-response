import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getPaymentMonitorState, runPaymentMonitor } from "./paymentMonitor";
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
