---
title: Repeated Application Crash
incidentType: restart_loop
severity: Critical
action: Stop automatic retries and escalate for root-cause investigation.
keywords: crash, restart, loop, memory, repeated, failure
---

# Repeated Application Crash

**Service:** application-service  
**Severity:** Critical

## Symptoms
The same service restarts repeatedly within a short period.

## Approved action
Do not restart indefinitely. Stop retries and escalate with the incident timeline.

## Follow-up
Inspect recent code changes, memory usage, and application logs.
