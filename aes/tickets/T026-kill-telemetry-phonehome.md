---
ticket: T026
title: Kill telemetry phone-home to ee.formbricks.com
sprint: sprint-02
priority: blocker
status: pending
created: 2026-09-11
---

# T026 — Kill telemetry phone-home to ee.formbricks.com

## Context
The fork claims "no EE phone-home" (CLAUDE.md line 37) but `apps/web/modules/response-pipeline/lib/telemetry.ts:274-288` still POSTs usage telemetry to `https://ee.formbricks.com/api/v1/instances/${instanceId}/usage-updates`. This runs on every response pipeline job. The `TELEMETRY_DISABLED` env var is commented out by default in `.env.example:342`, so production phones home out-of-the-box.

This is the single biggest remaining leak in a fork claiming zero EE traces.

## Acceptance Criteria
- [ ] `telemetry.ts` no longer POSTs to `ee.formbricks.com`
- [ ] Telemetry function is either removed entirely or made a no-op
- [ ] `.env.example` has `TELEMETRY_DISABLED=1` as default (not commented out)
- [ ] `docker/docker-compose.yml` sets `TELEMETRY_DISABLED=1` if not already present
- [ ] `telemetry.test.ts` is updated to reflect the neutered behavior
- [ ] Grep for `ee.formbricks.com` returns zero matches in source code

## Scope
**In scope:** `apps/web/modules/response-pipeline/lib/telemetry.ts`, `telemetry.test.ts`, `.env.example`, `docker/docker-compose.yml`
**Out of scope:** Other telemetry (PostHog, OpenTelemetry) — those are separate concerns

## Dependencies
None — this is the highest priority fix.

## Rollback
Restore `telemetry.ts` from git HEAD (the upstream version). But this would re-introduce the phone-home.

## Known Risks
- If the telemetry endpoint is also used for legitimate usage tracking (e.g., aggregate stats), removing it breaks that. However, CLAUDE.md explicitly prohibits phone-home.
- The `instanceId` generated in `telemetry.ts` may have side effects elsewhere — need to check if anything depends on it.

## Notes
- The telemetry test at `telemetry.test.ts:54` mocks `ENTERPRISE_LICENSE_KEY` and `getEnterpriseLicense` returning `{active:false}` — these mocks exercise behavior the stub module can no longer produce. Test needs updating.
- Server logs should be checked to determine if any data was actually transmitted.
