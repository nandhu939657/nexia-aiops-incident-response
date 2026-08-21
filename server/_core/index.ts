import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getPaymentHealthResponse, heartbeatJob, ingestProviderEvent } from "../incidentEngine";
import { sdk } from "./sdk";
import { getPaymentMonitorState, runPaymentMonitor } from "../paymentMonitor";
import { checkConfiguredUrls } from "../urlMonitor";
import { getMonitorConfigurationByTaskUid, recordMonitorCheck } from "../monitorConfig";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.get("/health", (_req, res) => {
    res.json(getPaymentHealthResponse());
  });
  const authorizeJobRequest = (req: express.Request, res: express.Response) => {
    const expected = process.env.NEXIA_JOB_INGEST_TOKEN;
    if (!expected) return true;
    if (req.header("x-nexia-job-token") === expected) return true;
    res.status(401).json({ ok: false, error: "invalid-job-token" });
    return false;
  };
  app.post("/api/scheduled/user-monitor", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ ok: false, error: "cron-only" });
      const config = await getMonitorConfigurationByTaskUid(user.taskUid);
      if (!config || !config.enabled) return res.json({ ok: true, skipped: "orphan-or-disabled" });
      const result = await checkConfiguredUrls(config.applicationUrl, config.healthUrl ?? undefined);
      await recordMonitorCheck(config.id, { status: result.overall === "unreachable" ? "unreachable" : result.overall === "healthy" ? "healthy" : "degraded", detail: `${result.overall}: ${result.application.detail}${result.health ? `; health: ${result.health.detail}` : ""}` });
      return res.json({ ok: true, monitorId: config.id, checkedAt: result.checkedAt, overall: result.overall, responseMode: config.responseMode, responseContactConfigured: Boolean(config.responseContact), approvalRequired: true, approvedAction: config.approvedAction });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "scheduled-user-monitor-failed", context: { path: "/api/scheduled/user-monitor" }, timestamp: new Date().toISOString() });
    }
  });
  app.post("/api/scheduled/payment-monitor", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ ok: false, error: "cron-only" });
      return res.json(await runPaymentMonitor("scheduled"));
    } catch (error) {
      return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "scheduled-monitor-failed", context: { path: "/api/scheduled/payment-monitor" }, timestamp: new Date().toISOString() });
    }
  });
  app.post("/api/monitor/payment/run-now", async (req, res) => {
    if (!authorizeJobRequest(req, res)) return;
    try { return res.json(await runPaymentMonitor("manual")); }
    catch (error) { return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "payment-monitor-failed" }); }
  });
  app.get("/api/monitor/payment/status", (_req, res) => res.json({ ok: true, monitor: getPaymentMonitorState() }));
  app.post("/api/jobs/heartbeat", (req, res) => {
    if (!authorizeJobRequest(req, res)) return;
    try {
      const { id, status, durationMs, externalId, metadata } = req.body ?? {};
      res.json({ ok: true, job: heartbeatJob({ id, status, durationMs, externalId, metadata }) });
    } catch (error) {
      res.status(400).json({ ok: false, error: error instanceof Error ? error.message : "invalid-heartbeat" });
    }
  });
  app.post("/api/webhooks/firecrawl", (req, res) => {
    if (!authorizeJobRequest(req, res)) return;
    const body = req.body ?? {};
    const statusMap: Record<string, "running" | "succeeded" | "failed" | "healthy"> = { started: "running", page: "running", completed: "succeeded", failed: "failed" };
    const status = statusMap[String(body.type ?? body.event ?? body.status)] ?? "running";
    res.json(ingestProviderEvent("firecrawl", { externalId: body.id ?? body.jobId, status, message: body.error ?? body.message }));
  });
  app.post("/api/webhooks/apify", (req, res) => {
    if (!authorizeJobRequest(req, res)) return;
    const body = req.body ?? {};
    const rawStatus = String(body.status ?? body.eventType ?? body.event ?? "RUNNING").toUpperCase();
    const status = rawStatus.includes("SUCCEED") ? "succeeded" : rawStatus.includes("FAIL") ? "failed" : rawStatus.includes("ABORT") ? "paused" : "running";
    res.json(ingestProviderEvent("apify", { externalId: body.resource?.id ?? body.runId ?? body.id, status, message: body.errorMessage ?? body.message, durationMs: body.resource?.stats?.runTimeSecs ? body.resource.stats.runTimeSecs * 1000 : undefined }));
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
