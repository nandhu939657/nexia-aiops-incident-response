---
title: Payment Service Failure
incidentType: health_check_failed
severity: Critical
action: Restart the mock payment service after explicit approval.
keywords: payment, unavailable, health, 503, checkout, error
---

# Payment Service Failure

**Service:** payment-service  
**Severity:** Critical

## Symptoms
The payment API returns HTTP 503 responses, the health check is unhealthy, and the error rate is above 80%.

## Approved action
Request human approval, then restart the mock payment service once.

## Prohibited actions
Do not delete data, rotate credentials, or execute arbitrary commands.

## Escalation
Escalate if the service remains unhealthy after the approved restart.
