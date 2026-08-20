import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
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
});

export type AppRouter = typeof appRouter;
