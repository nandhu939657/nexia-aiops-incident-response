import React, { useState } from "react";
import { Activity, Bot, FileText, History, Menu, Settings, Siren, X, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";

const navigation = [
  { href: "/", label: "Overview", icon: Activity },
  { href: "/incidents", label: "Incidents", icon: Siren },
  { href: "/jobs", label: "Jobs", icon: Bot },
  { href: "/runbooks", label: "Runbooks", icon: FileText },
  { href: "/activity", label: "Activity log", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const active = navigation.find(item => item.href === location) ?? navigation[0];

  return <div className="min-h-screen bg-[#f4f6fb] text-slate-950">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-white/10 bg-[#0b1220] text-white transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-[78px] items-center justify-between border-b border-white/10 px-6"><Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#9bf2cb] text-[#0b1220]"><Activity className="h-5 w-5" /></span><span><span className="block text-sm font-semibold tracking-wide">NEXIA</span><span className="block text-[10px] uppercase tracking-[0.24em] text-slate-400">Incident operations</span></span></Link><button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X className="h-5 w-5 text-slate-400" /></button></div>
      <nav className="flex-1 space-y-1 px-3 py-7"><p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace</p>{navigation.slice(0, 5).map(item => { const Icon = item.icon; const isActive = location === item.href; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${isActive ? "bg-white/10 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon className={`h-4 w-4 ${isActive ? "text-[#9bf2cb]" : ""}`} />{item.label}{item.href === "/incidents" && <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300">Live</span>}</Link> })}<p className="px-3 pb-3 pt-8 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">System</p><Link href="/settings" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${location === "/settings" ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Settings className="h-4 w-4" />Settings</Link><div className="flex items-center gap-3 px-3 py-3 text-sm text-slate-400"><Zap className="h-4 w-4" />Automation <span className="ml-auto h-2 w-2 rounded-full bg-[#9bf2cb] shadow-[0_0_0_4px_rgba(155,242,203,.12)]" /></div></nav>
      <div className="m-3 rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-slate-400">Workspace health</span><span className="h-2 w-2 rounded-full bg-[#9bf2cb]" /></div><p className="text-sm font-medium">All systems nominal</p><p className="mt-1 text-xs text-slate-500">Updated just now</p></div>
    </aside>
    {mobileOpen && <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}
    <main className="lg:pl-[248px]"><header className="sticky top-0 z-20 flex min-h-[78px] items-center justify-between border-b border-slate-200/80 bg-white/85 px-5 backdrop-blur md:px-10"><div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Nexia control plane</p><h1 className="mt-1 text-xl font-semibold tracking-tight">{active.label}</h1></div></div><div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 md:flex">Search <kbd className="ml-3 rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">⌘ K</kbd></div><div className="grid h-9 w-9 place-items-center rounded-full bg-[#e7eaff] text-sm font-semibold text-indigo-700">AS</div></div></header><div className="mx-auto max-w-[1440px] px-5 py-7 md:px-10"><div className="mb-6 flex items-center gap-2 text-xs text-slate-400"><Link href="/" className="hover:text-slate-700">Nexia</Link><span>/</span><span className="text-slate-600">{active.label}</span></div>{children}</div></main>
  </div>;
}
