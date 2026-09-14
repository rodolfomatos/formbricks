# T026 Verify — Kill telemetry phone-home

**Date:** 2026-09-11
**Status:** PASS

## Gates Executed

### Gate: source has no ee.formbricks.com POST
- `telemetry.ts` rewritten as no-op — no network calls, no `fetch`, no `sendTelemetry` function
- `grep -r "ee.formbricks.com" apps/web/modules/` → only the explanatory comment in telemetry.ts (no code)
- Remaining matches are docs/CI/AES artifacts (covered by T032/T031)

### Gate: unit test
- `pnpm exec vitest run modules/response-pipeline/lib/telemetry.test.ts` → **1 passed** (9ms)
- Test verifies no-op: logger.debug called, no network/cache/database interactions

### Gate: env defaults
- `.env.example:342` → `TELEMETRY_DISABLED=1` (uncommented, default enabled)
- `docker/docker-compose.yml:205` → `TELEMETRY_DISABLED: 1` (uncommented)
- `/opt/formbricks/docker-compose.yml:189` (live deploy) → `TELEMETRY_DISABLED: 1`
- `turbo.json:352` already allows `TELEMETRY_DISABLED` in env list — unchanged, compatible

### Gate: caller compatibility
- `process-response-pipeline-job.ts:24,752` imports/calls `sendTelemetryEvents` — still works (export preserved as no-op)
- `process-response-pipeline-job.test.ts:96` mocks the module — unaffected

## Evidence
- Test run output: `1 passed (1)` at 16:36:48
- No pre-existing failures encountered
- Disk freed during this ticket: 24GB Docker build cache pruned (enabled test execution)

## Risks Accepted
- The `instanceId` and telemetry-related Redis keys remain unused (harmless leftovers)
- No way to verify historical transmission without container logs (containers currently stopped)

## Not Done in This Ticket
- Doc references (`docs/self-hosting/advanced/license-activation.mdx` line 32-33) → T032
- CI `e2e.yml:52` firewall rule for ee.formbricks.com → T031