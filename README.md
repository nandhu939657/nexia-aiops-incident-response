# Nexia — AI-Assisted Incident Response

Nexia watches services, detects failures, and walks a human through a supervised incident-response loop: alert → AI-classified incident → matching runbook → **mandatory human approval** → simulated remediation → notification → auto-generated post-mortem.

Built as an academic DevOps demonstration, but the workflow is the real thing — no step ever runs without an explicit approval.

## What it does

- **Track any URL.** Paste an application URL (and optional health-check URL); Nexia checks it on a schedule, keeps a full check-history timeline per URL (uptime %, response-time trend, log of every check), and opens an incident once it fails enough times in a row.
- **Simulated payment service.** A built-in mock service with a JSON `/health` endpoint, plus one-click failure/recovery controls, for demonstrating the pipeline without a real outage.
- **Background job monitoring.** A normalized view over internal workers and Firecrawl-/Apify-style task providers, with the same approval-gated recovery actions (retry/pause/replay).
- **LLM-classified incidents.** Every incident is classified (Critical/Warning/Informational) by an LLM, grounded in the matching Markdown runbook, with a plain-English explanation and a recommended action.
- **Non-bypassable approval.** Nothing is remediated until a human types `APPROVE`. This is the one rule that holds everywhere in the codebase.
- **Markdown runbooks & post-mortems.** A local runbook knowledge base drives every recommendation; resolving an incident auto-generates a Markdown post-mortem.
- **OmniDim voice-alert boundary.** A dispatch-ready integration point for critical-incident voice calls (simulated unless real credentials are supplied).

## Tech stack

React 19 · TypeScript · Vite · Express · tRPC · Drizzle ORM · Postgres (Supabase) · Supabase Auth · Tailwind CSS · Vitest

## Quick start

```bash
pnpm install
cp .env.example .env   # fill in your Postgres/Supabase/LLM values — see SETUP_REQUIREMENTS.md
pnpm db:push
pnpm dev
```

Full environment-variable reference, Supabase setup, and troubleshooting: **[SETUP_REQUIREMENTS.md](SETUP_REQUIREMENTS.md)**.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the local dev server (Express + Vite, hot reload) |
| `pnpm build` | Build the production frontend + server bundle |
| `pnpm start` | Run the production build (`pnpm build` first) |
| `pnpm check` | TypeScript validation |
| `pnpm test` | Run the Vitest suite |
| `pnpm db:push` | Generate and apply Drizzle migrations |
| `pnpm format` | Format with Prettier |

## How it's organized

```
client/src/pages/       React pages — Overview, Incidents, Jobs, Runbooks, Activity log, Settings
client/src/components/  Shared UI, including AuthGate (Supabase sign-in) and monitor cards
server/incidentEngine.ts  Incident lifecycle: create, classify, approve, resolve
server/monitorConfig.ts   Per-user tracked-URL config, check history, failure-threshold → incident logic
server/urlMonitor.ts      Safe outbound URL checks (SSRF-guarded)
server/runbooks/          Markdown knowledge base (frontmatter-tagged)
server/_core/             Express app, tRPC context, Supabase auth verification, LLM client
drizzle/schema.ts         Database schema (Postgres via Drizzle)
```

## Documentation

- **[SETUP_REQUIREMENTS.md](SETUP_REQUIREMENTS.md)** — full local setup: prerequisites, environment variables, database, troubleshooting.
- **[WORKSPACE_GUIDE.md](WORKSPACE_GUIDE.md)** — a plain-English tour of every workspace (Overview, Incidents, Jobs, Runbooks, Activity log): what's on each page and what you can do there.
- **[TESTING_URLS.md](TESTING_URLS.md)** — a curated, verified set of public URLs for exercising the URL-tracking feature (healthy, slow, 4xx, 5xx, unreachable).
- **[provider_integration_findings.md](provider_integration_findings.md)** — research notes on real Firecrawl/Apify integration for the background-jobs feature.

## Safety model

- **Human approval is mandatory** for every remediation action, everywhere — incidents, tracked-URL recovery, and background-job recovery all require typing `APPROVE` before anything runs.
- **SSRF-protected URL checks** — only public `https://`/`http://` URLs are allowed; `localhost`, `*.local`, and private/internal IP ranges are rejected.
- **Secrets stay server-side.** Provider credentials (Groq, OmniDim, Supabase service role, Firecrawl, Apify) are read from environment variables only and never sent to the browser; `.env` is gitignored.

## License

MIT
