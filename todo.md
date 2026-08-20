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
- [ ] Save final project checkpoint and deliver project version

- [x] Load runbooks from the local Markdown files as the retrieval source of truth
- [x] Display retrieved runbook Markdown beside the AI recommendation in the approval view
- [x] Add frontend tests for approval gating, incident details, and primary dashboard flows
- [ ] Save a final WebDev checkpoint and deliver the project version

- [x] Parse runbook metadata from Markdown frontmatter so retrieval no longer depends on hardcoded metadata
- [x] Add dashboard component/integration tests for approval, incident detail, and post-mortem states

- [x] Add a dashboard component test for a resolved incident with Markdown post-mortem content
- [x] Add a dashboard component test for the empty post-mortem state
