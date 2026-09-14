---
ticket: T025
title: AES Verify phase — add container log check gate
sprint: sprint-02
priority: low
status: backlog
created: 2026-07-01
---

# T025 — AES Verify: add container log check gate

## Context
T017 learn phase identified that hot-patch deploys need a "check full container logs" gate in the Verify phase. Without it, runtime errors in compiled chunks go undetected until users report them.

## Acceptance Criteria
- [ ] `scripts/verify-implementation.sh` includes a container log check
- [ ] The check greps docker logs for ERROR, FATAL, unhandled rejection patterns
- [ ] The check fails if any of these patterns are found in the last N minutes
- [ ] The gate is documented in `docs/QUALITY_GATES.md`

## Scope
**In scope:** `scripts/verify-implementation.sh`, `docs/QUALITY_GATES.md`
**Out of scope:** Continuous monitoring (that's infrastructure, not AES)

## Dependencies
None — AES improvement.

## Rollback
Remove the gate from the verify script.

## Known Risks
- Container logs may contain benign errors that trigger false positives
- The check needs a configurable time window (last 5 min? 1 hour?)

## Notes
- Source: T017 learn phase — "Full docker logs check must be a Verify gate for hot-patch deploys"
- Consider using `docker logs --since 5m` to limit the check window
