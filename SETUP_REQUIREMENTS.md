# Nexia — Local Setup and Requirements

Nexia is an AI-assisted incident management and auto-remediation platform built for an academic DevOps demonstration. It includes a simulated payment service, background-job monitoring, LLM-assisted incident classification, Markdown runbook retrieval, mandatory human approval for remediation, OmniDim voice-alert preparation, scheduled health monitoring, and Markdown post-mortem generation.

> **Important:** The repository contains application source code, but it does not contain private credentials, database passwords, OAuth secrets, or API keys. Those values must be supplied separately through environment variables.

## 1. System requirements

| Requirement | Recommended version or description |
|---|---|
| Operating system | Windows 10/11, macOS, or Linux |
| Node.js | Node.js 22 or newer |
| Package manager | pnpm 10.x; npm may work, but pnpm is recommended because the project includes a pnpm lockfile |
| Database | MySQL-compatible database, including TiDB or a local MySQL 8 installation |
| Git | Required for cloning and version control |
| Browser | A current version of Chrome, Edge, Firefox, or Safari |
| Optional platform services | OAuth, built-in LLM, and platform storage/notification services for the complete cloud experience |

The project uses React 19, TypeScript, Vite, Express, tRPC, Drizzle ORM, and MySQL-compatible database connectivity through `mysql2`.

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
| `DATABASE_URL` | Connection string for the MySQL-compatible database used by Drizzle ORM |
| `JWT_SECRET` | Secret used to sign and verify application sessions; use a long random value |
| `VITE_APP_ID` | OAuth application identifier |
| `OAUTH_SERVER_URL` | OAuth and user-information service URL |
| `OWNER_OPEN_ID` | Owner identity used by the platform environment |
| `BUILT_IN_FORGE_API_URL` | Server-side URL for the platform's built-in APIs, including LLM-related services |
| `BUILT_IN_FORGE_API_KEY` | Server-side credential for the platform's built-in APIs |

### Required for the browser client

| Variable | Purpose |
|---|---|
| `VITE_OAUTH_PORTAL_URL` | Browser URL used by `client/src/const.ts` to begin the OAuth login flow |
| `VITE_APP_ID` | OAuth application identifier read by the browser login flow |

The exact values for these variables are environment-specific. In the original Manus deployment they are injected automatically by the platform. If you run Nexia on your own computer, obtain equivalent values from the platform project settings or configure a compatible OAuth service. The current frontend source does not require `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`, `VITE_APP_TITLE`, or `VITE_APP_LOGO`; do not add them unless you introduce code that reads them.

A minimal local development file may look like this, but the placeholder values must be replaced before running the complete application:

```dotenv
NODE_ENV=development
DATABASE_URL=mysql://username:password@localhost:3306/nexia
JWT_SECRET=replace-with-a-long-random-secret
VITE_APP_ID=replace-with-your-oauth-app-id
OAUTH_SERVER_URL=https://your-oauth-server.example.com
OWNER_OPEN_ID=replace-with-owner-open-id
BUILT_IN_FORGE_API_URL=https://your-built-in-api.example.com
BUILT_IN_FORGE_API_KEY=replace-with-server-api-key
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.example.com
```

Do not copy production secrets into public issue reports, screenshots, source files, or Git commits.

## 4. Database setup

Nexia uses a **MySQL-compatible database** through Drizzle ORM. The database schema is defined in `drizzle/schema.ts`. Configure `DATABASE_URL` before running database commands.

For a local MySQL installation, create an empty database first:

```sql
CREATE DATABASE nexia;
```

Then run the project database command:

```bash
pnpm db:push
```

The database is used for application and platform data such as users, incident records, monitored jobs, activity events, and related workflow state. The mock payment service itself is simulated in the application and does not require a separate payment database.

> **Warning:** Do not run destructive database commands against a production database. Use a separate development database for local testing.

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
| Payment monitoring | Uses the simulated payment service and its JSON `/health` endpoint |
| Failure and recovery | Dashboard controls simulate a payment outage and service restoration |
| Incident classification | Uses the configured built-in LLM when available; otherwise the local workflow can still be demonstrated through its incident path |
| Runbook retrieval | Reads Markdown files from `server/runbooks` |
| Remediation approval | Requires an explicit human approval action before simulated remediation |
| Background jobs | Demonstrates internal, Firecrawl-style, Apify-style, and generic monitored-job states |
| Post-mortems | Generates Markdown incident records in the application workflow |
| Scheduled payment monitor | Uses the platform-managed Heartbeat schedule in the deployed environment |
| OmniDim | Uses a dispatch boundary and simulation mode unless real OmniDim configuration is supplied |

## 8. Optional real integrations

Real Firecrawl, Apify, OmniDim, Slack, or other provider integrations are not required for the current college project demonstration. They require separate accounts, credentials, endpoint configuration, and provider-specific testing.

For OmniDim, the current application includes a dispatch boundary at `POST /api/v1/calls/dispatch`. Supplying a real OmniDim API key is optional and should only be done through a secure environment-variable or secret-management system.

For Firecrawl and Apify, the application supports monitored-job and webhook-style flows without requiring private provider credentials. Credentials are needed only when you want Nexia to call those live services rather than demonstrate simulated or manually reported job states.

## 9. Scheduled monitoring limitation

The platform-managed payment monitor is configured for the deployed Nexia site. A local computer cannot receive the production Heartbeat schedule unless the callback is publicly reachable and the platform schedule is configured for that deployment. For a college demonstration, use the deployed project or trigger the manual monitoring route from the application workflow.

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

If the application reports a missing database connection, verify that `DATABASE_URL` is present and that the database server is running. If authentication does not work locally, check the OAuth application ID, OAuth server URL, and portal URL. If LLM-powered classification is unavailable, verify the built-in API URL and server-side API key; the rest of the simulated incident workflow can still be used for demonstration.

If the server reports that a runbook file cannot be found, run `pnpm build` again and confirm that `dist/runbooks` contains files such as `payment-service-failure.md`, `high-cpu.md`, `repeated-crash.md`, and `high-error-rate.md`.

## 12. Recommended demonstration flow

Start the application, open the Overview page, and select **Simulate incident**. Review the generated incident severity, impact explanation, and retrieved runbook. Navigate to the incident detail page and demonstrate that remediation is blocked until the human approval action is completed. After approval, run the simulated remediation, prepare the OmniDim alert boundary, view the notification record, and open the generated Markdown post-mortem. Finally, use the Jobs workspace to explain heartbeat monitoring and the deployed scheduled payment check.

## 13. Security checklist

Keep `.env` files outside version control and never paste secret values into the GitHub repository. Use separate development and production databases. Use a strong random `JWT_SECRET`. Do not enable real voice calls or live provider actions until the integration credentials, recipients, and approval policy have been reviewed. Preserve the mandatory human approval gate when extending remediation behavior.
