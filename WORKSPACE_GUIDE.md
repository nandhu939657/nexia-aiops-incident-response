# Nexia Workspace Guide

Nexia's sidebar has five workspaces under "Workspace": **Overview, Incidents, Jobs, Runbooks, Activity log**. (The red **Live** tag you see next to "Incidents" isn't a separate page — it's just a badge telling you that queue updates in real time.)

This guide walks through each one: what's on the screen, and exactly what you can click or do.

---

## 1. Overview (`/`)

**What's on the page:**
- A collapsible **"New to Nexia? Start here"** box at the top — plain-language explanations of the concepts (incident, runbook, approval, etc.).
- A big dark **"Live control plane"** card with two buttons.
- A **"Checkout API"** card showing the mock payment service's current health, a fake availability chart, and the raw `GET /health` result.
- Four stat tiles: Open incidents, Critical this shift, Mean response, Noise suppressed.
- Three shortcut cards at the bottom: Review incidents, Browse runbooks, Trace activity.

**What you can do:**
1. Click **Simulate incident** — this flips the mock payment service to "unhealthy" *and* immediately creates a Critical incident, so you can see the whole flow without waiting.
2. Click **Restore service** — flips the mock service back to healthy.
3. Click any of the three shortcut cards to jump straight to that workspace.

This page is your "what's going on right now" snapshot — it doesn't let you configure anything, just trigger the demo failure/recovery and jump elsewhere.

---

## 2. Incidents (`/incidents`)

**What's on the page:**
- A search box, plus a **Severity** filter (Critical/Warning/Informational) and a **Status** filter (Awaiting approval/Resolved/Remediating).
- Left column: the list of incidents — each row shows the ID, severity badge, the alert message, and its current status.
- Right column ("Decision brief") for whichever incident you've selected:
  - **AI assessment**: the LLM's plain-English explanation of what's wrong, and its recommended action.
  - **Retrieved runbook**: the actual runbook text Nexia matched this incident to.
  - Error rate / affected users numbers.
  - Either an **approval box** (if still open) or a **resolved summary** (if it's done).
  - If resolved: the generated Slack-style notification text and the full Markdown post-mortem appear below.

**What you can do:**
1. Search or filter the list to find a specific incident.
2. Click any incident in the list to load its brief on the right.
3. Type the word **APPROVE** into the box and click **Approve** — this is the only way remediation runs; nothing happens automatically.
4. Click **Prepare OmniDim call** to simulate readying a voice-alert dispatch for that incident.
5. Click **Open detail page** to view the same incident on its own full-page URL (`/incidents/INC-00x`) with more room.

This is where you actually *work* an incident — read the AI's reasoning, check it against the runbook, and approve (or not).

---

## 3. Jobs (`/jobs`)

This is the busiest page — it covers both the demo background jobs *and* the real URL-tracking feature.

**What's on the page, top to bottom:**
1. **Payment-service cron monitor** card — shows when the scheduled payment check last ran and its result, plus a **Run health check now** button.
2. **Quick URL checker** — paste any application URL (and optional health URL) and get an instant one-time check. No sign-in needed; history only lives in your browser tab and disappears when you close it.
3. **Set up automatic monitoring** — this is where you sign in (or create an account) and then add a URL Nexia will check on a real schedule, saved to your account. Below the form, you'll see a list of every URL you've already added, each with its current status.
4. Four metric tiles: monitored jobs, healthy/complete, needs attention, providers.
5. The **monitored jobs list** (left) and a **job detail panel** (right) for the built-in demo jobs (an internal worker, a Firecrawl-style crawl, an Apify-style actor run).

**What you can do:**
- Click **Run health check now** to manually trigger the payment-service scheduled check.
- Use the quick checker for a throwaway, no-login check of any URL.
- Sign in, then:
  - Fill in an application URL (and optionally a health URL, check frequency, and — under "Advanced settings" — the runbook instructions, alert method, and failure threshold), and click **Start monitoring**.
  - On any saved monitor: click **Check now** for an immediate check, **Pause/Resume** to stop/restart its schedule, **Remove** to delete it, or **View timeline** to open its dedicated history page (uptime %, response-time chart, and a full log of every check — see below).
- Click any job in the demo list to see its detail (last success, duration, retries, error message, metadata).
- Click **Simulate failure** on a job to mark it failed, then type **APPROVE** and choose an action (retry/pause/replay) to recover it — same approval-gate rule as incidents.
- Click **Poll provider** to refresh a job's status from its (simulated) external provider.

**The monitor timeline page** (opened via "View timeline", URL like `/jobs/monitors/3`):
- Shows uptime percentage, a response-time trend chart, and a chronological log of every single check (status, latency, and a link straight to any incident that check triggered).
- Has its own **Check now** button.

---

## 4. Runbooks (`/runbooks`)

**What's on the page:**
- A search box and a list of runbook cards on the left (title, incident type, severity badge).
- The full Markdown text of whichever runbook is selected, on the right.

**What you can do:**
1. Search by title, type, or severity.
2. Click a runbook card to read its full step-by-step procedure — the same text the AI reads before making a recommendation on the Incidents page.

This page is read-only — there's nothing to configure here, it's purely for browsing the knowledge base.

---

## 5. Activity log (`/activity`)

**What's on the page:**
- A search box.
- A single chronological timeline built from every incident: when each alert came in, when the AI made its decision, and when (if) it was resolved — each entry timestamped.

**What you can do:**
1. Search/filter the timeline by keyword.
2. Read it as an audit trail — "what happened and when," in order, across every incident so far.

This page is also read-only — it's the record-keeping view, not an action page.

---

## Quick summary table

| Workspace | Purpose in one line | Main actions |
|---|---|---|
| Overview | See status at a glance, trigger the demo | Simulate incident, Restore service |
| Incidents | Investigate and approve fixes | Search/filter, Approve, Prepare OmniDim call |
| Jobs | Set up and watch real/demo monitoring | Add a tracked URL, Check now, Approve job recovery |
| Runbooks | Read the fix instructions Nexia uses | Search, read |
| Activity log | See the full history of everything | Search, read |
