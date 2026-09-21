import React, { useState } from "react";
import { LogOut, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Gates URL tracking (a per-user, database-backed feature) behind Supabase
 * email/password auth. Renders a compact sign-in/sign-up card when signed
 * out, and the wrapped feature — plus a small "signed in as" strip — once
 * `auth.me` resolves to a user.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const client = supabase;

  if (!me.data && me.isLoading) return <Card className="border-0 bg-white p-6 text-sm text-slate-400 shadow-sm">Checking your session…</Card>;

  if (!me.data) {
    if (!isSupabaseConfigured || !client) {
      return <Card className="border-0 bg-amber-50 shadow-sm"><CardContent className="p-5 text-sm text-amber-900">Sign-in is not configured. Set <code className="rounded bg-white/60 px-1">VITE_SUPABASE_URL</code> and <code className="rounded bg-white/60 px-1">VITE_SUPABASE_ANON_KEY</code> to enable tracked URLs.</CardContent></Card>;
    }

    const submit = async () => {
      if (!email.trim() || !password) return;
      setSubmitting(true);
      try {
        const action = mode === "sign-in" ? client.auth.signInWithPassword({ email: email.trim(), password }) : client.auth.signUp({ email: email.trim(), password });
        const { error } = await action;
        if (error) throw error;
        toast.success(mode === "sign-in" ? "Signed in" : "Account created", { description: mode === "sign-up" ? "Check your inbox if email confirmation is required." : undefined });
        void utils.auth.me.invalidate();
      } catch (error) {
        toast.error("Could not sign in", { description: error instanceof Error ? error.message : "Unknown error" });
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-4 w-4 text-indigo-600" />Sign in to track URLs</CardTitle>
          <p className="text-xs leading-5 text-slate-400">Tracked URLs and their history are saved per account. Sign in or create an account to continue.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5"><span className="field-label block">Email</span><input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="input" /></label>
            <label className="space-y-1.5"><span className="field-label block">Password</span><input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="At least 6 characters" className="input" /></label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={submit} disabled={submitting || !email.trim() || password.length < 6}><Mail className="mr-2 h-4 w-4" />{submitting ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}</Button>
            <button type="button" className="text-xs font-medium text-indigo-600 hover:underline" onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}>{mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}</button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const signOut = async () => {
    await client?.auth.signOut();
    utils.auth.me.setData(undefined, null);
    void utils.auth.me.invalidate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500 shadow-sm">
        <span>Signed in as <span className="font-medium text-slate-700">{me.data.email ?? me.data.name ?? "your account"}</span></span>
        <Button variant="outline" size="sm" onClick={signOut}><LogOut className="mr-1.5 h-3.5 w-3.5" />Sign out</Button>
      </div>
      {children}
    </div>
  );
}
