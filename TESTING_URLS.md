# Nexia Testing URLs

This guide contains public URLs that can be entered in **Jobs → Check an application**. Nexia checks these URLs on demand and keeps recent results only in the current browser session. Do not enter passwords, API keys, private service URLs, or confidential customer endpoints.

## Recommended healthy test

Use this pair for the first test:

| Field | URL | Expected result |
|---|---|---|
| Application URL | `https://httpbin.org/get` | The endpoint should be reachable and return HTTP 200. |
| Health URL | `https://httpbin.org/status/200` | The endpoint should return HTTP 200. |

After entering both URLs, select **Submit and check**. Nexia should show an overall **healthy** result and display the response status and latency.

## Failure test

Use the same application URL with the following health URL:

| Field | URL | Expected result |
|---|---|---|
| Application URL | `https://httpbin.org/get` | The endpoint should remain reachable. |
| Health URL | `https://httpbin.org/status/503` | The endpoint intentionally returns HTTP 503. |

Nexia should report that the health check is unhealthy or needs attention. This is useful for demonstrating the failure path without stopping a real application.

## JSON health-response test

The following public endpoint returns JSON and is useful for basic response inspection:

```text
Application URL: https://httpbin.org/get
Health URL:      https://httpbin.org/json
```

The endpoint is expected to be reachable. Because its JSON does not necessarily follow Nexia's `{ "status": "healthy" }` contract, use it to demonstrate the difference between **endpoint reachability** and a structured health result.

## Nexia self-test

The deployed Nexia project can also be checked:

| Field | URL |
|---|---|
| Application URL | `https://aiopsrespons-c4aa2und.manus.space` |
| Health URL | `https://aiopsrespons-c4aa2und.manus.space/health` |

The main application URL should be reachable. The `/health` endpoint should return a healthy JSON response when the simulated payment service is operating normally.

To test the full built-in incident workflow, use the Nexia dashboard's **Simulate incident** or **Simulate Failure** control rather than changing the public URL to a real failing service. This keeps the demonstration safe and preserves the approval-gated remediation flow.

## URL behavior reference

| URL or response | What Nexia should show |
|---|---|
| `https://httpbin.org/status/200` | Healthy or reachable HTTP 200 response |
| `https://httpbin.org/status/503` | Unhealthy HTTP 503 response |
| Invalid domain | Unreachable or DNS failure |
| Private or localhost URL | Rejected for safety by URL validation |
| Main URL returns HTTP 200 but health URL fails | Application reachable, health check needs attention |
| No health URL provided | Nexia checks only the application URL |

## How to use the recent-check table

After each submission, Nexia adds the result to **Recently checked URLs**. The table is session-only and is not stored in the Nexia database. Select **View status** for a row to see the application result, health result, HTTP status, response latency, JSON health status when available, and the overall outcome.

## Important limitations

These public endpoints are demonstration services. They do not represent a real payment system, database, customer workload, or production application. An application URL alone verifies basic web reachability; a health URL provides stronger evidence about application health only when the application exposes a meaningful health contract.

For a real application, use its documented public URL and health endpoint. If the application is running only on `localhost`, Nexia's hosted deployment cannot normally reach it unless the application is also exposed through a secure public HTTPS development URL.
