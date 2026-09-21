# Nexia — Local Setup and Requirements

Nexia is an AI-assisted incident management and auto-remediation platform built for an academic DevOps demonstration. It includes a simulated payment service, background-job monitoring, per-URL tracking with a live check timeline, LLM-assisted incident classification, Markdown runbook retrieval, mandatory human approval for remediation, OmniDim voice-alert preparation, scheduled health monitoring, and Markdown post-mortem generation.

The database is a **Postgres** database (Supabase-hosted by default) accessed through Drizzle ORM, and sign-in uses **Supabase Auth** (email/password) — both run standalone, independent of any particular deployment platform, so the app runs the same way locally as anywhere else.

> **Important:** The repository contains application source code, but it does not contain private credentials, database passwords, OAuth secrets, or API keys. Those values must be supplied separately through environment variables.

## 1. System requirements

| Requirement | Recommended version or description |
|---|---|
| Operating system | Windows 10/11, macOS, or Linux |
| Node.js | Node.js 22 or newer |
| Package manager | pnpm 10.x; npm may work, but pnpm is recommended because the project includes a pnpm lockfile |
| Database | A Postgres database — a free [Supabase](https://supabase.com) project is the easiest option, or any Postgres 14+ instance |
| Auth provider | A [Supabase](https://supabase.com) project (same project as the database works fine) for email/password sign-in |
| Git | Required for cloning and version control |
| Browser | A current version of Chrome, Edge, Firefox, or Safari |
| Optional platform services | The platform's built-in LLM and scheduled-cron services for the complete cloud experience (see section 9) |

The project uses React 19, TypeScript, Vite, Express, tRPC, Drizzle ORM, Postgres connectivity through the `postgres` driver, and Supabase Auth (`@supabase/supabase-js`) for sign-in.

## 2. Clone the repository

```bash
git clone https://github.com/nandhu939657/nexia-aiops-incident-response.git
cd nexia-aiops-incident-response
pnpm install
```

The GitHub repository is private. You must have access to the repository through your GitHub account before cloning it.

## 3. Environment variables

Create a file named `.env` in the project root. Never commit this file to GitHub. The repository already ignores `.env` files through `.gitignore`.

### Required for the server

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string used by Drizzle ORM. For Supabase, use the pooler connection string from Project Settings → Database, with your database password URL-encoded (e.g. `@` becomes `%40`) |
| `JWT_SECRET` | Secret used by legacy platform session code paths; use a long random value even though local sign-in no longer depends on it |
| `SUPABASE_URL` | Your Supabase project URL, e.g. `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service role** key (Project Settings → API). Server-side only — verifies sign-in tokens. Never expose this to the browser |

### Required for the browser client

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Same Supabase project URL as `SUPABASE_URL`, exposed to the browser |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon/publishable** key (Project Settings → API) — safe for the browser, used to start the sign-in flow |

Get all four Supabase values from your project's Settings → API and Settings → Database pages. Do not copy production secrets into public issue reports, screenshots, source files, or Git commits — `.env` is already gitignored.

A minimal local development file looks like this:

```dotenv
NODE_ENV=development
DATABASE_URL=postgresql://postgres.<project-ref>:<url-encoded-password>@aws-0-<region>.pooler.supabase.com:6543/postgres
JWT_SECRET=replace-with-a-long-random-secret
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-service-role-key
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=replace-with-anon-or-publishable-key
```

The `VITE_APP_ID`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, and `VITE_OAUTH_PORTAL_URL` variables from earlier versions of this project are no longer required for sign-in or the database; they only matter if you re-enable the platform-managed scheduled cron or built-in LLM (see section 9).

## 4. Database setup

Nexia uses **Postgres** through Drizzle ORM. The database schema is defined in `drizzle/schema.ts`. Configure `DATABASE_URL` before running database commands.

If you're using a fresh Supabase project, the `public` schema already exists — no manual `CREATE DATABASE` step is needed. Then run the project database commands:

```bash
pnpm db:push
```

This generates and applies migrations under `drizzle/`. The database holds application data such as users, per-URL monitor configurations, monitor check history, and related workflow state. The mock payment service itself is simulated in the application and does not require a separate payment database.

> **Warning:** Do not run destructive database commands against a production database. Use a separate Supabase project (or database) for local development versus anything shared.
>
> **Note on Supabase's pooler:** the pooler connection (port `6543`) does not support session-scoped prepared statements, so `server/db.ts` connects with `prepare: false`. If you switch to the direct connection (port `5432`), this still works fine.

## 5. Start the development server

After installing dependencies and configuring the environment, start Nexia with:

```bash
pnpm dev
```

The development server normally starts on port `3000`. Open the URL shown in the terminal, usually:

```text
http://localhost:3000
```

The server and frontend are served together through the Express and Vite development setup.

## 6. Verify the project

Run the type checker and test suite before making changes:

```bash
pnpm check
pnpm test
```

The current project includes backend, frontend, route, monitoring, health-contract, and approval-safety tests. A production build can be checked with:

```bash
pnpm build
pnpm start
```

The production build copies the Markdown runbooks into `dist/runbooks`, which is required for the incident engine to start successfully.

## 7. Features that work without third-party API keys

The following academic demonstration features work without connecting real external services:

| Feature | Local demonstration behavior |
|---|---|
| Sign-in | Real Supabase email/password auth — works anywhere, including localhost, once `SUPABASE_URL`/keys are set |
| Tracked URLs | Paste an application (and optional health) URL; Nexia checks it, keeps a check-history timeline, and opens an incident after repeated failures. Requires sign-in and a working `DATABASE_URL` |
| Payment monitoring | Uses the simulated payment service and its JSON `/health` endpoint |
| Failure and recovery | Dashboard controls simulate a payment outage and service restoration |
| Incident classification | Uses the configured built-in LLM when available; otherwise the local workflow can still be demonstrated through its incident path |
| Runbook retrieval | Reads Markdown files from `server/runbooks` |
| Remediation approval | Requires an explicit human approval action before simulated remediation |
| Background jobs | Demonstrates internal, Firecrawl-style, Apify-style, and generic monitored-job states |
| Post-mortems | Generates Markdown incident records in the application workflow |
| Scheduled payment/URL monitor | Uses the platform-managed Heartbeat schedule in the deployed environment; use "Check now" locally instead (see section 9) |
| OmniDim | Uses a dispatch boundary and simulation mode unless real OmniDim configuration is supplied |

## 8. Optional real integrations

Real Firecrawl, Apify, OmniDim, Slack, or other provider integrations are not required for the current college project demonstration. They require separate accounts, credentials, endpoint configuration, and provider-specific testing.

For OmniDim, the current application includes a dispatch boundary at `POST /api/v1/calls/dispatch`. Supplying a real OmniDim API key is optional and should only be done through a secure environment-variable or secret-management system.

For Firecrawl and Apify, the application supports monitored-job and webhook-style flows without requiring private provider credentials. Credentials are needed only when you want Nexia to call those live services rather than demonstrate simulated or manually reported job states.

## 9. Scheduled monitoring limitation

The platform-managed payment and URL monitors are configured for the deployed Nexia site. A local computer cannot receive the production Heartbeat schedule unless the callback is publicly reachable and the platform schedule is configured for that deployment — this also means the built-in LLM classification (`BUILT_IN_FORGE_API_URL`/`KEY`) is unavailable locally unless you swap `server/_core/llm.ts` for a real LLM provider. For a local demonstration, use the **Check now** button on a tracked URL (Jobs page) or the manual payment monitor trigger, both of which run the same check-and-classify logic on demand.

## 10. Common commands

| Command | Purpose |
|---|---|
| `pnpm install` | Install project dependencies |
| `pnpm dev` | Start the development server |
| `pnpm check` | Run TypeScript validation |
| `pnpm test` | Run the Vitest test suite |
| `pnpm build` | Create the production frontend and server bundle |
| `pnpm start` | Start the production bundle after `pnpm build` |
| `pnpm db:push` | Generate and apply Drizzle database migrations |
| `pnpm format` | Format project files with Prettier |

## 11. Troubleshooting

If the application reports a missing database connection, verify that `DATABASE_URL` is present, correctly URL-encodes any special characters in the password (e.g. `@` → `%40`), and that `pnpm db:push` has been run against it. A "password authentication failed" error almost always means the password is wrong or not encoded — re-copy it from Supabase's Project Settings → Database page. Commands like `drizzle-kit generate`/`migrate` only read `.env` if you pass `DATABASE_URL=... pnpm ...` inline or your shell has exported it; they do not always auto-load `.env` on Windows shells.

If sign-in does not work locally, check `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server) and `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client) are all set and restart `pnpm dev` after editing `.env`. If LLM-powered classification is unavailable, verify the built-in API URL and server-side API key; the rest of the simulated incident workflow can still be used for demonstration.

If the server reports that a runbook file cannot be found, run `pnpm build` again and confirm that `dist/runbooks` contains files such as `payment-service-failure.md`, `high-cpu.md`, `repeated-crash.md`, and `high-error-rate.md`.

## 12. Recommended demonstration flow

Start the application, open the Overview page, and select **Simulate incident**. Review the generated incident severity, impact explanation, and retrieved runbook. Navigate to the incident detail page and demonstrate that remediation is blocked until the human approval action is completed. After approval, run the simulated remediation, prepare the OmniDim alert boundary, view the notification record, and open the generated Markdown post-mortem. Then open the Jobs workspace, sign in (or create an account) when prompted, add a tracked URL, and open its timeline page to show the uptime percentage, response-time trend, and check-by-check log, including an incident opened automatically after repeated failures.

## 13. Security checklist

Keep `.env` files outside version control and never paste secret values into the GitHub repository. Use separate development and production databases. Use a strong random `JWT_SECRET`. Do not enable real voice calls or live provider actions until the integration credentials, recipients, and approval policy have been reviewed. Preserve the mandatory human approval gate when extending remediation behavior.
