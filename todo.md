# Project TODO

- [x] Build the operations dashboard shell with enterprise-grade visual styling
- [x] Add mock payment-service live health status indicator
- [x] Add Simulate Failure and Restore Service controls
- [x] Add JSON `/health` endpoint returning healthy or unhealthy status
- [x] Generate incident alert JSON with service name, severity, error rate, affected users, and timestamp
- [x] Add genuine LLM-powered severity classification with exact labels: Critical, Warning, Informational
- [x] Generate plain-English impact explanation and recommended runbook action
- [x] Add local Markdown runbook knowledge base for payment failure, high CPU, repeated crash, and high error rate
- [x] Add runbook search and retrieval layer
- [x] Add mandatory side-by-side approval workflow with non-bypassable Approve click
- [x] Add simulated remediation action with approval enforcement
- [x] Add OmniDim voice-alert integration boundary using POST `/api/v1/calls/dispatch`
- [x] Add critical-incident voice-call simulation and optional real dispatch configuration
- [x] Add structured Slack-style incident notification panel
- [x] Generate Markdown post-mortem records with required incident fields
- [x] Add incident history list with severity, status, and runbook used
- [x] Add incident detail view with full Markdown post-mortem
- [x] Add backend and frontend tests for core workflows and approval safety
- [x] Verify build, tests, JSON endpoint, and primary UI flows
- [x] Save final project checkpoint and deliver project version

- [x] Load runbooks from the local Markdown files as the retrieval source of truth
- [x] Display retrieved runbook Markdown beside the AI recommendation in the approval view
- [x] Add frontend tests for approval gating, incident details, and primary dashboard flows
- [x] Save a final WebDev checkpoint and deliver the project version

- [x] Parse runbook metadata from Markdown frontmatter so retrieval no longer depends on hardcoded metadata
- [x] Add dashboard component/integration tests for approval, incident detail, and post-mortem states

- [x] Add a dashboard component test for a resolved incident with Markdown post-mortem content
- [x] Add a dashboard component test for the empty post-mortem state

# Multi-page refactor and usability backlog

- [x] Add shared multi-page application shell with persistent sidebar and responsive mobile navigation
- [x] Add Overview page focused on service health, key metrics, and quick actions
- [x] Add Incidents page with searchable, filterable incident table and status/severity filters
- [x] Add Incident detail page with breadcrumbs, AI assessment, runbook, approval, OmniDim, notification, and post-mortem sections
- [x] Add Runbooks page with searchable Markdown runbook cards and detail view
- [x] Add Activity page with chronological event timeline and incident filtering
- [x] Add Settings page with approval policy, notification mode, and integration status panels
- [x] Add user-friendly command/search affordance, contextual empty states, and success/error feedback
- [x] Preserve existing mock payment, LLM, remediation, OmniDim, and post-mortem workflows across pages
- [x] Add multi-page routing and component tests
- [x] Verify responsive pages, tests, and save an updated checkpoint

- [x] Add and verify the `incidents.get` tRPC procedure used by the dedicated detail route
- [x] Add page and route tests for Incidents, IncidentDetail, Runbooks, Activity, and Settings
- [x] Verify the full multi-page simulate, approve, remediate, OmniDim, notification, and post-mortem workflow
- [x] Save and deliver a new checkpoint for the multi-page refactor

- [x] Add App-level route coverage for `/incidents`, `/incidents/:id`, `/runbooks`, `/activity`, and `/settings`
- [x] Add a cross-page workflow test covering simulate, approval gating, remediation, OmniDim preparation, notification, and post-mortem output
- [x] Save and deliver the updated multi-page checkpoint

- [x] Add an App/UI integration test for incidents-to-detail navigation, blocked approval, OmniDim preparation, approval, notification, and post-mortem rendering

- [x] Extend the App/UI integration test to start on `/incidents` and navigate through the detail-page link
- [x] Assert a visible OmniDim preparation result after the prepare-call action

# Real application and background-job monitoring

- [x] Add monitored-job data model for service, provider, heartbeat, status, last success, duration, retries, and failure details
- [x] Add provider types for internal jobs, Firecrawl tasks, Apify actors, and generic HTTP/webhook jobs
- [x] Add authenticated job heartbeat and failure-ingestion endpoints
- [x] Add provider-aware status polling/adapters without hardcoding private credentials
- [x] Add safe remediation actions for retry, pause, replay, and provider-specific task recovery with mandatory approval
- [x] Add Jobs monitoring page with live status, stale-heartbeat detection, filters, and detail view
- [x] Add provider/integration status page with setup guidance and connection health
- [x] Add background-job runbooks and LLM classification coverage
- [x] Add real-job tests and cross-page monitoring workflow tests
- [x] Add required secrets through the project secret manager only when live integrations are enabled (not required for the current webhook/manual monitor mode)
- [x] Verify the real-job flows and save an updated checkpoint

# Scheduled payment-service monitor

- [x] Add platform-managed scheduled endpoint under `/api/scheduled/`
- [x] Make the payment monitor check `/health` and record idempotent heartbeat state
- [x] Create an incident signal when repeated scheduled checks observe an unhealthy payment service
- [x] Add a manual test-trigger path for the same monitor logic
- [x] Add schedule status and last-run visibility to the Jobs workspace
- [x] Add cron-monitor tests for healthy, unhealthy, retry, and idempotency behavior
- [x] Document that the platform schedule requires a deployed production URL before activation
- [x] Save and deliver an updated checkpoint

- [x] Create the platform-managed `payment-service-monitor` cron after the user deploys the checkpointed site (task UID: `8GAT2WbvdH2VbU7Q7vZ5qV`; execution history was empty during the verification window)

- [x] Make the payment monitor explicitly evaluate the `/health` JSON contract instead of reading only in-process service state
- [x] Require two consecutive unhealthy scheduled checks before creating the payment incident
- [x] Add tests for health-response parsing and first-versus-repeated unhealthy checks

- [x] Add a shared parser for `/health` JSON payloads and make the monitor validate that contract
- [x] Add tests for healthy, unhealthy, and malformed health JSON payloads
- [x] Re-run direct `/health` and manual monitor endpoint verification

- [x] Capture the explicit JSON response and HTTP status from `POST /api/monitor/payment/run-now` after the health-parser changes

# Deployment startup fix

- [x] Copy Markdown runbooks into `dist/runbooks` during the production build
- [x] Verify every packaged runbook exists at the runtime path expected by the bundled server
- [x] Run typecheck, tests, production build, and a production-style startup smoke test
- [x] Save and deliver a corrected deployment checkpoint

# Local setup documentation

- [x] Add a complete Markdown guide covering local prerequisites, installation, environment variables, database setup, optional integrations, and run commands
- [x] Validate the guide against the current project scripts and configuration
- [x] Commit and push the setup guide to the private GitHub repository
- [x] Verify the pushed documentation on GitHub


# Transient application URL monitoring

- [x] Add transient application URL and health URL input flow without persisting submitted URL values or response data
- [x] Add server-side URL validation and safe outbound HTTP checks with timeout and SSRF protections
- [x] Add a curated test URL catalog and clear test-mode guidance
- [x] Add on-demand URL checks to the dashboard with reachability, status, latency, and health-contract results
- [x] Integrate persisted monitor profiles with the platform-compatible scheduled monitor without using in-process timers; document that non-persistent URL checks are on-demand only
- [x] Add frontend, backend, and route-level tests for URL validation, check results, privacy behavior, and failure handling
- [x] Save an updated checkpoint after final responsive UI, test, and production-build validation

# Configurable user monitoring

- [x] Add persisted per-user monitor configuration for application URL, health URL, frequency, schedule time, runbook instructions, response/contact settings, failure threshold, and approved action
- [x] Add schema migration and ownership-safe database helpers for monitor configurations
- [x] Add user-facing tRPC procedures to create, update, pause, resume, check, and delete monitor configurations
- [x] Add platform Heartbeat creation and task UID persistence for configured monitors
- [x] Add `/api/scheduled/user-monitor` callback that looks up configuration by cron task UID and runs idempotent checks
- [x] Capture configurable response/contact settings and expose a dispatch-ready response plan without exposing secrets or sending unapproved remediation
- [x] Add Jobs workspace configuration form for URLs, schedule, runbook, action, and response settings
- [x] Preserve mandatory human approval for every remediation action
- [x] Add migration verification, backend/frontend/route tests, responsive visual verification, and production build validation

# User-friendly monitoring UI

- [x] Simplify monitoring setup into a guided basic flow with plain-language labels and examples
- [x] Keep the basic flow focused on URLs and frequency; show daily time only when needed and move runbook, response, and threshold controls into an optional advanced section
- [x] Improve status/result explanations and next-step guidance for non-technical users
- [x] Add UI tests and responsive visual verification for the revised Jobs monitoring experience
- [x] Save a checkpoint for the user-friendly monitoring UI update

# Recent transient URL checks

- [x] Add a clear Submit and check button to the transient URL checker
- [x] Keep a session-only recent URL history without persisting submitted URLs or response data
- [x] Show selected recent-check status with reachability, HTTP status, latency, and health-contract details
- [x] Add focused UI coverage, responsive visual verification, production validation, and a checkpoint

# Testing URL catalog and GitHub sync

- [ ] Add a Markdown catalog of normal, health, failure, and Nexia self-test URLs with expected results
- [ ] Validate the catalog against the current UI presets and public deployment URL
- [ ] Commit and push the latest code and testing catalog to the public GitHub repository
- [ ] Verify the public remote branch and catalog link
