import React, { useMemo } from "react";
import { ArrowLeft, CheckCircle2, Clock3, ExternalLink, Gauge, HeartPulse, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthGate } from "@/components/AuthGate";

const overallTone: Record<string, string> = {
  healthy: "bg-emerald-50 text-emerald-700",
  degraded: "bg-amber-50 text-amber-700",
  unreachable: "bg-red-50 text-red-700",
};
const overallLabel: Record<string, string> = {
  healthy: "Healthy",
  degraded: "Needs attention",
  unreachable: "Unreachable",
};

export default function MonitorDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const monitorId = Number(id);
  const me = trpc.auth.me.useQuery();
  const history = trpc.monitoring.history.useQuery({ id: monitorId, limit: 100 }, { enabled: Number.isFinite(monitorId) && Boolean(me.data), refetchInterval: 15_000 });
  const checkSaved = trpc.monitoring.checkSaved.useMutation({
    onSuccess: result => { void history.refetch(); toast.success(result.overall === "healthy" ? "Application is healthy" : "Application needs attention", { description: result.incidentCreated ? "An incident was opened from this check." : undefined }); },
    onError: error => toast.error("Check could not complete", { description: error.message }),
  });

  const config = history.data?.config;
  const checks = history.data?.checks ?? [];
  const chronological = useMemo(() => [...checks].reverse(), [checks]);
  const uptimePercent = useMemo(() => {
    if (checks.length === 0) return undefined;
    const healthyCount = checks.filter(check => check.overall === "healthy").length;
    return Math.round((healthyCount / checks.length) * 1000) / 10;
  }, [checks]);
  const chartData = useMemo(
    () => chronological.filter(check => check.applicationLatencyMs != null).map(check => ({ time: new Date(check.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), latency: check.applicationLatencyMs as number })),
    [chronological],
  );

  if (me.isLoading) return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-20 text-center text-sm text-slate-400">Checking your session…</div>;
  if (!me.data) return <AuthGate><div /></AuthGate>;
  if (history.isLoading) return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-20 text-center text-sm text-slate-400">Loading tracked URL…</div>;
  if (!config) return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-20 text-center"><p className="text-sm font-medium">Tracked URL not found</p><Link href="/jobs" className="mt-3 inline-block text-sm text-indigo-600">Return to Jobs</Link></div>;

  return (
    <AuthGate>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/jobs" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Tracked URL</p>
          <h2 className="mt-2 truncate text-3xl font-semibold tracking-tight">{config.name}</h2>
          <p className="mt-2 break-all text-sm text-slate-500">{config.applicationUrl}</p>
        </div>
        <Badge className={`shrink-0 border-0 capitalize ${config.lastStatus ? overallTone[config.lastStatus === "unhealthy" ? "unreachable" : config.lastStatus] : "bg-slate-100 text-slate-500"}`}>
          {config.lastStatus ? overallLabel[config.lastStatus === "unhealthy" ? "unreachable" : config.lastStatus] ?? config.lastStatus : "Not checked yet"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Uptime (recent checks)" value={uptimePercent !== undefined ? `${uptimePercent}%` : "—"} icon={<Gauge className="h-4 w-4" />} />
        <Metric label="Checks recorded" value={String(checks.length)} icon={<Clock3 className="h-4 w-4" />} />
        <Metric label="Consecutive failures" value={String(config.consecutiveFailures)} icon={<ShieldAlert className="h-4 w-4" />} />
        <Metric label="Failure threshold" value={String(config.failureThreshold)} icon={<HeartPulse className="h-4 w-4" />} />
      </div>

      <Card className="border-0 bg-white shadow-sm">
        <CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Live status</CardTitle><Button variant="outline" size="sm" onClick={() => checkSaved.mutate({ id: monitorId })} disabled={checkSaved.isPending}><RefreshCw className={`mr-2 h-3.5 w-3.5 ${checkSaved.isPending ? "animate-spin" : ""}`} />Check now</Button></div><p className="text-xs leading-5 text-slate-500">Nexia checks this URL continuously on its schedule ({describeCron(config.cronExpression)}), even while nobody has this page open. This view refreshes automatically.</p></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Last checked: {config.lastCheckedAt ? new Date(config.lastCheckedAt).toLocaleString() : "Not checked yet"} · {config.lastResult ?? "Waiting for the first check."}</div>
          {chartData.length > 1 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={48} label={{ value: "ms", position: "insideTopLeft", fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip formatter={(value: number) => [`${value} ms`, "Response time"]} />
                  <Line type="monotone" dataKey="latency" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">Response-time trend appears once a few checks have run.</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm">
        <CardHeader><CardTitle>What's happening</CardTitle><p className="text-xs leading-5 text-slate-400">A chronological record of every check, so you can see exactly when this application changed state.</p></CardHeader>
        <CardContent className="p-0">
          {checks.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">No checks recorded yet. Use Check now, or wait for the next scheduled check.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {checks.map(check => (
                <div key={check.id} className="flex items-start gap-3 px-5 py-4">
                  <div className="mt-0.5">{check.overall === "healthy" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : check.overall === "degraded" ? <ShieldAlert className="h-4 w-4 text-amber-500" /> : <XCircle className="h-4 w-4 text-red-500" />}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`border-0 text-xs capitalize ${overallTone[check.overall]}`}>{overallLabel[check.overall]}</Badge>
                      <span className="text-xs text-slate-400">{new Date(check.checkedAt).toLocaleString()}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{check.source}</span>
                      {check.applicationLatencyMs != null && <span className="text-xs text-slate-400">{check.applicationLatencyMs}ms</span>}
                      {check.incidentId && <Link href={`/incidents/${check.incidentId}`} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">Incident {check.incidentId}<ExternalLink className="h-3 w-3" /></Link>}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{check.applicationDetail}</p>
                    {check.healthDetail && <p className="mt-0.5 text-xs text-slate-400">Health check: {check.healthDetail}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AuthGate>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-center justify-between text-slate-400"><span className="text-xs">{label}</span>{icon}</div><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p></div>;
}

function describeCron(cron: string) {
  if (cron === "0 * * * * *") return "every minute";
  if (cron === "0 */5 * * * *") return "every 5 minutes";
  if (cron === "0 0 * * * *") return "every hour";
  return "on a daily schedule";
}
