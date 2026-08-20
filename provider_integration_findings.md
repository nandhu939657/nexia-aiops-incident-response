# Provider integration findings

## Firecrawl

Firecrawl crawl jobs can be submitted asynchronously through `POST https://api.firecrawl.dev/v2/crawl`, returning a job ID. The job can be monitored by polling `GET /v2/crawl/<jobId>` or by attaching a webhook to the crawl request. Firecrawl webhooks support lifecycle events including `started`, `page`, `completed`, and `failed`; the receiving HTTPS endpoint should return a 2xx response within 10 seconds. The Nexia adapter should store the provider job ID, accept webhook events idempotently, and map provider states into `queued`, `running`, `succeeded`, `failed`, or `stale`.

## Apify

Apify exposes REST API v2 endpoints for starting Actor or task runs and for retrieving run status. The documented workflow is to start an Actor/task run, monitor it by polling the Get run endpoint, and retrieve results using the run's dataset identifiers. Apify also supports webhooks configured for system events; the documented webhook action is an HTTP POST to a configured URL. The Nexia adapter should store the Actor/task identifier and run ID, accept webhook events idempotently, and map Apify run states into the same normalized job states.

## Nexia design implications

The product should support both push and pull monitoring. Push webhooks provide fast updates, while a scheduled heartbeat or manual refresh can reconcile provider state when a webhook is delayed. Real provider API tokens must be stored server-side through the project secret manager and never sent to the browser. Remediation should remain approval-gated: retry/replay, abort, pause, or provider-specific recovery actions must be explicit, allowlisted, and auditable.

## Sources

1. Firecrawl, “Crawl,” https://docs.firecrawl.dev/features/crawl
2. Firecrawl, “Webhooks overview,” https://docs.firecrawl.dev/webhooks/overview
3. Apify, “API v2,” https://docs.apify.com/api/v2
4. Apify, “Webhook integration,” https://docs.apify.com/integrations/webhooks
