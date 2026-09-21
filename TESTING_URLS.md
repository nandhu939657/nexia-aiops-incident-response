# Nexia — Test URL Catalog

A set of public, verified URLs for exercising the URL-tracking feature (Jobs page → quick checker or "Set up automatic monitoring"). All of these were curl-tested directly before being added here.

> Only public `https://` URLs work — Nexia blocks `localhost`, `*.local`, and private/internal IP addresses on both the application and health URL fields (SSRF protection in `server/urlMonitor.ts`). You can't point it at your own local dev server.

## 1. Healthy — should report "Application is healthy"

| Application URL | Health URL (optional) | What it tests |
|---|---|---|
| `https://example.com` | `https://httpbin.org/status/200` | The baseline good case — reachable, HTTP 200 on both |
| `https://httpbin.org` | — | A real, slightly heavier public site with no separate health URL |

## 2. Slow but healthy — tests latency reporting

| Application URL | What it tests |
|---|---|
| `https://httpbin.org/delay/3` | Returns HTTP 200 but after ~3–4 seconds — check that the reported latency (`ms`) reflects this, and that it still counts as healthy since the status code is fine |

## 3. Client error (4xx) — degraded, not necessarily critical

| Application URL | What it tests |
|---|---|
| `https://httpbin.org/status/404` | A "page not found" response — should show as not-OK with `HTTP 404` |

## 4. Server error (5xx) — the main failure case

| Application URL | What it tests |
|---|---|
| `https://httpbin.org/status/503` | Simulates a service outage (503 Service Unavailable) — this is the one to use for testing incident creation |
| `https://httpbin.org/status/500` | Generic server error variant |

**To see the full incident pipeline fire**, set this as a tracked URL's Application URL with a low failure threshold (e.g. 2), then either wait for the scheduled check to run twice, or click **Check now** twice in a row on its timeline page. The second failing check should open a real incident — check the Incidents page and the monitor's timeline for the linked `INC-xxx` entry.

## 5. Unreachable — DNS/connection failure

| Application URL | What it tests |
|---|---|
| `https://this-domain-should-not-exist-nexia-demo-12345.com` | Doesn't resolve at all — should show as **Unreachable**, not just "unhealthy" (different code path than an HTTP error status) |

## 6. Built-in one-click presets

The quick checker on the Jobs page already ships two presets (`server/urlMonitor.ts` → `URL_TEST_PRESETS`) you can select without typing anything:
- **Public demo application** — `https://example.com` + `https://httpbin.org/status/200` (healthy)
- **Failure simulation** — `https://example.com` + `https://httpbin.org/status/503` (health check fails)

## 7. The JSON health-contract format

Nexia treats a response as explicitly healthy/unhealthy (beyond just the HTTP status) when the health URL returns JSON shaped like:

```json
{ "status": "healthy" }
```
or
```json
{ "status": "unhealthy" }
```

Nexia's own `/health` endpoint (`server/_core/index.ts`) returns exactly this shape — `{"service":"payment-service","status":"healthy"}` — so once this app is deployed somewhere with a public URL, that endpoint is the most realistic example of the contract. `httpbin.org` endpoints don't return this shape, so against them the "health status" field will show as `unknown` even while the HTTP status check still works correctly.

## Suggested test pass

1. Healthy URL → confirm green/healthy result with a real latency number.
2. `httpbin.org/delay/3` → confirm it's still healthy but latency is visibly higher.
3. `httpbin.org/status/404` → confirm a degraded/not-ok result with `HTTP 404`.
4. `httpbin.org/status/503` as a **tracked** URL, checked twice → confirm status flips to unreachable/degraded, an incident is created, and it shows up on both the Incidents page and the monitor's timeline.
5. The unresolvable domain → confirm it's reported as **unreachable**, distinctly from the HTTP-error cases above.
