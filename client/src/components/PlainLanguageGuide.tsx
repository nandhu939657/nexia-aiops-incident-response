import React from "react";
import { BookOpen, ChevronDown, CircleHelp, ExternalLink } from "lucide-react";

const concepts = [
  ["Health URL", "A small page that tells Nexia whether your application is working. For example, /health can return healthy or unhealthy."],
  ["Runbook", "A step-by-step instruction sheet written by your team. Nexia shows the right runbook when something goes wrong."],
  ["Monitoring frequency", "How often Nexia checks your application. More frequent checks notice problems sooner."],
  ["Failure threshold", "How many failed checks are needed before Nexia creates an incident. Two failures help avoid false alarms."],
  ["Incident", "A problem that may affect your application or its users. Nexia collects the evidence in one place."],
  ["Remediation", "The proposed way to fix the problem, such as restarting a worker. Nexia never performs it without your approval."],
  ["Approval", "The safety step where a person reviews the evidence and explicitly allows the proposed fix."],
  ["Post-mortem", "A written summary of what happened, how it was fixed, and what the team can improve next time."],
];

export function PlainLanguageGuide({ compact = false }: { compact?: boolean }) {
  return <details className={`group overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/60 ${compact ? "" : "shadow-sm"}`}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-indigo-950"><span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-indigo-600" />New to Nexia? Start here</span><ChevronDown className="h-4 w-4 text-indigo-400 transition group-open:rotate-180" /></summary>
    <div className="border-t border-indigo-100 px-4 pb-4 pt-3"><p className="max-w-3xl text-sm leading-6 text-indigo-900">Nexia watches your application, notices unusual results, explains what may be wrong, and suggests a safe next step. You remain in control of every change.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{concepts.map(([term, explanation]) => <div key={term} className="rounded-xl bg-white/75 p-3"><p className="flex items-center gap-1.5 text-xs font-semibold text-slate-800"><CircleHelp className="h-3.5 w-3.5 text-indigo-500" />{term}</p><p className="mt-1.5 text-xs leading-5 text-slate-600">{explanation}</p></div>)}</div><p className="mt-4 flex items-center gap-1 text-xs text-indigo-700"><ExternalLink className="h-3.5 w-3.5" />Open a workspace when you are ready to try it.</p></div>
  </details>;
}
