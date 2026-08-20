import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  GitBranch,
  Headphones,
  History,
  Inbox,
  LockKeyhole,
  RotateCcw,
  Search,
  ShieldCheck,
  Siren,
  Sparkles,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { canApprove, incidentHeadline } from "@/lib/incidentUi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const severityStyles = {
  Critical: "border-red-200 bg-red-50 text-red-700",
  Warning: "border-amber-200 bg-amber-50 text-amber-700",
  Informational: "border-sky-200 bg-sky-50 text-sky-700",
};

function formatTime(value?: string) {
  return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
}

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const utils = trpc.useUtils();
  const statusQuery = trpc.service.status.useQuery(undefined, { refetchInterval: 2500 });
  const incidentsQuery = trpc.incidents.list.useQuery(undefined, { refetchInterval: 2500 });
  const runbooksQuery = trpc.runbooks.list.useQuery();
  const failureMutation = trpc.service.simulateFailure.useMutation();
  const restoreMutation = trpc.service.restore.useMutation();
  const createMutation = trpc.incidents.create.useMutation();
  const voiceMutation = trpc.incidents.triggerVoiceAlert.useMutation();
  const approveMutation = trpc.incidents.approveRemediation.useMutation();

  const incidents = incidentsQuery.data ?? [];
  const selected = incidents.find(incident => incident.id === selectedId) ?? incidents[0];
  const openIncidents = incidents.filter(incident => incident.status !== "Resolved").length;
  const criticalIncidents = incidents.filter(incident => incident.classification.severity === "Critical").length;
  const serviceHealthy = statusQuery.data?.status === "healthy";

  const stats = useMemo(() => [
    { label: "Open incidents", value: String(openIncidents).padStart(2, "0"), icon: Inbox, accent: "text-violet-600", note: openIncidents ? "Needs attention" : "All clear" },
    { label: "Critical this shift", value: String(criticalIncidents).padStart(2, "0"), icon: Siren, accent: "text-red-600", note: "Last 8 hours" },
    { label: "Mean response", value: "08m", icon: Clock3, accent: "text-emerald-600", note: "Target benchmark" },
    { label: "Noise suppressed", value: "70%", icon: ShieldCheck, accent: "text-blue-600", note: "Correlation engine" },
  ], [openIncidents, criticalIncidents]);

  const refresh = () => {
    void utils.service.status.invalidate();
    void utils.incidents.list.invalidate();
  };

  const simulateFailure = async () => {
    await failureMutation.mutateAsync();
    const incident = await createMutation.mutateAsync();
    setSelectedId(incident.id);
    toast.error("Critical incident created", { description: "Payment service is unhealthy. Review the AI recommendation." });
    refresh();
  };

  const restoreService = async () => {
    await restoreMutation.mutateAsync();
    toast.success("Payment service restored", { description: "The mock health endpoint is reporting healthy." });
    refresh();
  };

  const prepareVoiceAlert = async () => {
    if (!selected) return;
    await voiceMutation.mutateAsync({ id: selected.id });
    toast.success("OmniDim voice alert prepared", { description: "Dispatch boundary is ready at POST /api/v1/calls/dispatch." });
    refresh();
  };

  const approve = async () => {
    if (!selected || confirmation !== "APPROVE") return;
    await approveMutation.mutateAsync({ id: selected.id, confirmation: "APPROVE" });
    setConfirmation("");
    toast.success("Remediation approved and completed", { description: "The mock payment service recovered successfully." });
    refresh();
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-slate-200/80 bg-[#0b1220] text-white lg:flex">
        <div className="flex h-[78px] items-center gap-3 border-b border-white/10 px-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#9bf2cb] text-[#0b1220]"><Activity className="h-5 w-5" /></div>
          <div><p className="text-sm font-semibold tracking-wide">NEXIA</p><p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Incident operations</p></div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-7">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace</p>
          <a className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-sm font-medium text-white" href="#overview"><Activity className="h-4 w-4 text-[#9bf2cb]" />Overview</a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white" href="#incidents"><Siren className="h-4 w-4" />Incidents <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300">{openIncidents}</span></a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white" href="#runbooks"><FileText className="h-4 w-4" />Runbooks</a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white" href="#activity"><History className="h-4 w-4" />Activity log</a>
          <p className="px-3 pb-3 pt-8 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">System</p>
          <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400"><Zap className="h-4 w-4" />Automation <span className="ml-auto h-2 w-2 rounded-full bg-[#9bf2cb] shadow-[0_0_0_4px_rgba(155,242,203,.12)]" /></div>
          <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400"><LockKeyhole className="h-4 w-4" />Approval policy</div>
        </nav>
        <div className="m-3 rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-slate-400">Workspace health</span><span className="h-2 w-2 rounded-full bg-[#9bf2cb]" /></div><p className="text-sm font-medium">All systems nominal</p><p className="mt-1 text-xs text-slate-500">Updated just now</p></div>
      </aside>

      <main className="lg:pl-[248px]">
        <header className="flex min-h-[78px] items-center justify-between border-b border-slate-200/80 bg-white/80 px-5 backdrop-blur md:px-10"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Wednesday, August 20, 2026</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Operations overview</h1></div><div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 md:flex"><Search className="h-3.5 w-3.5" />Search incidents <kbd className="ml-3 rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">⌘ K</kbd></div><div className="grid h-9 w-9 place-items-center rounded-full bg-[#e7eaff] text-sm font-semibold text-indigo-700">AS</div></div></header>

        <div className="mx-auto max-w-[1440px] space-y-7 px-5 py-7 md:px-10" id="overview">
          <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <Card className="overflow-hidden border-0 bg-[#101a2c] text-white shadow-[0_18px_50px_rgba(16,26,44,.14)]"><CardContent className="relative p-7 md:p-9"><div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#9bf2cb]/10 blur-2xl" /><div className="relative max-w-xl"><div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#9bf2cb]"><span className="h-2 w-2 rounded-full bg-[#9bf2cb]" />Live control plane</div><h2 className="max-w-lg text-3xl font-semibold leading-tight tracking-tight md:text-4xl">Keep critical services calm under pressure.</h2><p className="mt-4 max-w-lg text-sm leading-6 text-slate-400">Nexia turns noisy signals into clear, approval-safe decisions — grounded in your runbooks and ready for the on-call team.</p><div className="mt-7 flex flex-wrap gap-3"><Button className="bg-[#9bf2cb] text-[#0b1220] hover:bg-[#b8f8dc]" onClick={simulateFailure} disabled={failureMutation.isPending || createMutation.isPending}><Siren className="mr-2 h-4 w-4" />Simulate incident</Button><Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={restoreService}><RotateCcw className="mr-2 h-4 w-4" />Restore service</Button></div></div></CardContent></Card>
            <Card className="border-0 bg-white shadow-[0_12px_35px_rgba(30,41,59,.06)]"><CardHeader className="flex-row items-start justify-between pb-2"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Mock payment service</p><CardTitle className="mt-2 text-xl tracking-tight">Checkout API</CardTitle></div><div className={`rounded-full px-3 py-1.5 text-xs font-semibold ${serviceHealthy ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}><span className={`mr-2 inline-block h-2 w-2 rounded-full ${serviceHealthy ? "bg-emerald-500" : "bg-red-500"}`} />{serviceHealthy ? "Healthy" : "Unhealthy"}</div></CardHeader><CardContent><div className="mt-5 rounded-2xl bg-slate-50 p-5"><div className="flex items-end justify-between"><div><p className="text-3xl font-semibold tracking-tight text-slate-900">99.98%</p><p className="mt-1 text-xs text-slate-500">Availability · last 24 hours</p></div><Activity className="h-7 w-7 text-emerald-500" /></div><div className="mt-5 flex h-12 items-end gap-1.5">{[35, 45, 42, 48, 54, 51, 62, 57, 68, 65, 76, 72, 78, 83, 79, 88, 82, 90, 86, 94, 88, 96, 91, 98].map((height, index) => <div key={index} className={`flex-1 rounded-t-sm ${index === 22 && !serviceHealthy ? "bg-red-400" : "bg-emerald-300"}`} style={{ height: `${height}%` }} />)}</div></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs"><span className="text-slate-500">GET /health</span><span className="font-medium text-slate-700">{serviceHealthy ? "200 · JSON healthy" : "503 · JSON unhealthy"}</span></div></CardContent></Card>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(stat => <Card key={stat.label} className="border-0 bg-white shadow-[0_8px_24px_rgba(30,41,59,.04)]"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-500">{stat.label}</p><stat.icon className={`h-4 w-4 ${stat.accent}`} /></div><p className="mt-4 text-3xl font-semibold tracking-tight">{stat.value}</p><p className="mt-1 text-xs text-slate-400">{stat.note}</p></CardContent></Card>)}</section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]" id="incidents">
            <Card className="border-0 bg-white shadow-[0_8px_24px_rgba(30,41,59,.04)]"><CardHeader className="flex-row items-center justify-between pb-4"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Response queue</p><CardTitle className="mt-2 text-xl tracking-tight">Recent incidents</CardTitle></div><Button variant="ghost" size="sm" className="text-slate-500" onClick={refresh}>Refresh <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Button></CardHeader><CardContent className="p-0"><div className="divide-y divide-slate-100">{incidents.length === 0 ? <div className="px-6 py-14 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Inbox className="h-5 w-5" /></div><p className="mt-4 text-sm font-medium">No incidents yet</p><p className="mt-1 text-xs text-slate-400">Simulate a failure to begin the response workflow.</p></div> : incidents.map(incident => <button key={incident.id} className={`flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-slate-50 ${selected?.id === incident.id ? "bg-indigo-50/60" : ""}`} onClick={() => setSelectedId(incident.id)}><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${incident.classification.severity === "Critical" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}><Siren className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{incidentHeadline(incident.id, incident.alert.serviceName)}</p><Badge variant="outline" className={`hidden border text-[10px] sm:inline-flex ${severityStyles[incident.classification.severity]}`}>{incident.classification.severity}</Badge></div><p className="mt-1 truncate text-xs text-slate-500">{incident.alert.message}</p></div><div className="hidden text-right sm:block"><p className="text-xs font-medium text-slate-700">{incident.status}</p><p className="mt-1 text-[11px] text-slate-400">{formatTime(incident.createdAt)}</p></div><ChevronRight className="h-4 w-4 text-slate-300" /></button>)}</div></CardContent></Card>

            <Card className="border-0 bg-white shadow-[0_8px_24px_rgba(30,41,59,.04)]"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Decision brief</p><CardTitle className="mt-2 text-xl tracking-tight">{selected ? selected.id : "Awaiting signal"}</CardTitle></div>{selected && <Badge variant="outline" className={`border ${severityStyles[selected.classification.severity]}`}>{selected.classification.severity}</Badge>}</div></CardHeader><CardContent>{!selected ? <div className="py-10 text-center text-sm text-slate-400">Select an incident to inspect its decision context.</div> : <div className="space-y-5"><div className="grid gap-3 lg:grid-cols-2"><div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700"><Sparkles className="h-3.5 w-3.5" />AI assessment</div><p className="mt-3 text-sm leading-6 text-slate-700">{selected.classification.explanation}</p><div className="mt-3 rounded-xl bg-white/70 p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Recommended action</p><p className="mt-1 text-sm font-medium text-slate-800">{selected.classification.recommendedAction}</p></div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"><FileText className="h-3.5 w-3.5" />Retrieved runbook</div><p className="mt-3 text-sm font-semibold text-slate-800">{selected.runbook.title}</p><pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-5 text-slate-500">{selected.runbook.markdown}</pre></div></div><div className="grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">Error rate</p><p className="mt-1 text-lg font-semibold">{Math.round(selected.alert.errorRate * 100)}%</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-400">Affected users</p><p className="mt-1 text-lg font-semibold">{selected.alert.affectedUsers}</p></div></div><div className="flex items-center justify-between border-t border-slate-100 pt-4"><div><p className="text-xs text-slate-400">Runbook retrieved</p><p className="mt-1 text-sm font-semibold">{selected.runbook.title}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Context grounded</span></div>{selected.status !== "Resolved" && <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800"><LockKeyhole className="h-3.5 w-3.5" />Approval required</div><p className="text-xs leading-5 text-amber-900/80">No remediation action can run until you explicitly approve this recommendation.</p><div className="flex gap-2"><input value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Type APPROVE" className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs outline-none ring-amber-300 focus:ring-2" /><Button size="sm" className="bg-[#101a2c] hover:bg-slate-800" disabled={!canApprove(selected.status, confirmation) || approveMutation.isPending} onClick={approve}><Check className="mr-1.5 h-3.5 w-3.5" />Approve</Button></div></div>}{selected.status === "Resolved" && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800"><Check className="h-3.5 w-3.5" />Resolved</div><p className="mt-2 text-sm text-emerald-900">{selected.actionResult}</p></div>}{selected.notification && <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4"><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9bf2cb]"><Zap className="h-3.5 w-3.5" />Notification sent</div><pre className="whitespace-pre-wrap font-mono text-[11px] leading-5 text-slate-300">{selected.notification}</pre></div>}<div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={prepareVoiceAlert} disabled={voiceMutation.isPending}><Headphones className="mr-1.5 h-3.5 w-3.5" />Prepare OmniDim call</Button>{selected.postMortemMarkdown && <Button variant="outline" size="sm" onClick={() => toast.info("Markdown post-mortem ready", { description: "Review the incident detail panel below." })}><FileText className="mr-1.5 h-3.5 w-3.5" />View post-mortem</Button>}</div>{selected.omnidim.status !== "not-triggered" && <p className="text-[11px] text-slate-400">OmniDim: {selected.omnidim.status} · POST /api/v1/calls/dispatch</p>}</div>}</CardContent></Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]" id="runbooks"><Card className="border-0 bg-white shadow-[0_8px_24px_rgba(30,41,59,.04)]"><CardHeader><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Knowledge base</p><CardTitle className="mt-2 text-xl tracking-tight">Runbook library</CardTitle></CardHeader><CardContent className="space-y-2">{(runbooksQuery.data ?? []).map(runbook => <div key={runbook.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500"><FileText className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{runbook.title}</p><p className="text-xs text-slate-400">{runbook.incidentType}</p></div><Badge variant="outline" className="text-[10px]">{runbook.severity}</Badge></div>)}</CardContent></Card><Card className="border-0 bg-white shadow-[0_8px_24px_rgba(30,41,59,.04)]" id="activity"><CardHeader><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Incident record</p><CardTitle className="mt-2 text-xl tracking-tight">Post-mortem detail</CardTitle></CardHeader><CardContent>{selected?.postMortemMarkdown ? <pre className="max-h-[340px] overflow-auto whitespace-pre-wrap rounded-2xl bg-[#101a2c] p-5 font-mono text-xs leading-6 text-slate-300">{selected.postMortemMarkdown}</pre> : <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 text-center"><Terminal className="h-5 w-5 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-500">No resolved incident record selected</p><p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">Once remediation is approved, Nexia will write a Markdown incident record here.</p></div>}</CardContent></Card></section>

          <footer className="flex flex-col gap-3 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><GitBranch className="h-3.5 w-3.5" />Nexia control plane · simulation mode</div><div className="flex items-center gap-4"><span>Approval policy enforced</span><span>Health API: JSON</span></div></footer>
        </div>
      </main>
    </div>
  );
}
