---
title: High Error Rate
incidentType: error_rate_threshold
severity: Warning
action: Inspect recent changes and request approval for a controlled rollback simulation.
keywords: error, rate, 5xx, deployment, rollback, requests
---

# High Error Rate

**Service:** application-service  
**Severity:** Warning

## Symptoms
The service returns an elevated proportion of 5xx responses.

## Approved action
Inspect recent changes and request human approval before a controlled rollback.

## Escalation
Escalate when customer impact is increasing or the rollback simulation fails.
