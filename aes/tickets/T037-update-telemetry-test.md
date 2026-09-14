---
ticket: T037
title: Update telemetry.test.ts to match neutered stubs
sprint: sprint-02
priority: minor
status: pending
created: 2026-09-11
---

# T037 — Update telemetry.test.ts to match neutered stubs

## Context
`apps/web/modules/response-pipeline/lib/telemetry.test.ts` still mocks `ENTERPRISE_LICENSE_KEY` env var and `getEnterpriseLicense` returning `{active:false}`. These mocks exercise behavior the stub module can no longer produce (the stub always returns `{active:true}`). The tests are stale.

## Acceptance Criteria
- [ ] Test mocks updated to reflect neutered license stub (active: true, all features true)
- [ ] Test cases for `ENTERPRISE_LICENSE_KEY` env var removed (no longer relevant)
- [ ] Test cases verify telemetry is disabled when `TELEMETRY_DISABLED=1`
- [ ] All tests pass

## Scope
**In scope:** `apps/web/modules/response-pipeline/lib/telemetry.test.ts`
**Out of scope:** `telemetry.ts` itself (covered by T026)

## Dependencies
T026 (kill telemetry) — if telemetry is removed entirely, this test file may be deleted.

## Rollback
Restore from git HEAD.

## Known Risks
- If T026 removes telemetry.ts entirely, this ticket becomes moot

## Notes
- The test file is 408 lines — may need significant rewriting depending on T026 outcome
