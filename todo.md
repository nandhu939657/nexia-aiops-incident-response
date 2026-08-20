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
- [ ] Save and deliver a new checkpoint for the multi-page refactor

- [x] Add App-level route coverage for `/incidents`, `/incidents/:id`, `/runbooks`, `/activity`, and `/settings`
- [x] Add a cross-page workflow test covering simulate, approval gating, remediation, OmniDim preparation, notification, and post-mortem output
- [ ] Save and deliver the updated multi-page checkpoint

- [x] Add an App/UI integration test for incidents-to-detail navigation, blocked approval, OmniDim preparation, approval, notification, and post-mortem rendering

- [x] Extend the App/UI integration test to start on `/incidents` and navigate through the detail-page link
- [x] Assert a visible OmniDim preparation result after the prepare-call action
