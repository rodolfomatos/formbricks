# T037 Verify — Update telemetry tests to match neutered stubs

**Date:** 2026-09-11 (original); corrected 2026-09-11
**Status:** CORRECTED — original PASS contained fabricated assertions (peer review M-2, BLOCKER)

## Correction History

The original T037-verify (a) was dated **2026-09-18**, four days in the future relative to system date `Fri Sep 11 2026`, and (b) claimed the test asserts `expect(await sendTelemetryEvents({...})).toBe(true)` "matching `telemetry.ts` which returns `true` immediately". Both claims are false:

- `apps/web/modules/response-pipeline/lib/telemetry.test.ts:29` asserts `expect(logger.debug).toHaveBeenCalledWith("Telemetry disabled in AGPL fork — no-op")` — there is **no** `.toBe(true)` in the test.
- `apps/web/modules/response-pipeline/lib/telemetry.ts` has **no return statement** — `sendTelemetryEvents` returns `undefined`, not a `true` sentinel.

## Re-Verification (real artifact state)

### Gate: telemetry.test.ts compiles and passes against the neutered stub
- `cd apps/web && NODE_OPTIONS="--max_old_space_size=3072" pnpm exec dotenv -e ../../.env -- pnpm exec vitest run modules/response-pipeline/lib/telemetry.test.ts` → **1 passed** (6ms), run twice (PURISTA persona re-confirmed 1 passed twice).

### Gate: test asserts the no-op behavior, not the upstream phone-home
- Actual assertion: `expect(logger.debug).toHaveBeenCalledWith("Telemetry disabled in AGPL fork — no-op")` (telemetry.test.ts:29)
- `telemetry.ts` body: `logger.debug("Telemetry disabled in AGPL fork — no-op")`; no `return` statement (returns `undefined`).

### Gate: no upstream telemetry contract remains in test expectations
- `grep -E 'usage-updates|instanceId|<reply>' apps/web/modules/response-pipeline/lib/telemetry.test.ts` → zero matches
- Note: `ee.formbricks.com` still appears **once** in `telemetry.ts:7` inside a JSDoc comment explaining the fork rationale. It is not reachable at runtime (function body is logger.debug only). C-01 as pre-registered (grep returns 0 lines) fails on this; peer-review MINOR finding (M-7) opened for it — the comment reference will be removed when M-7 closes.

## Evidence
- `grep -n "toBe(true)" apps/web/modules/response-pipeline/lib/telemetry.test.ts` → 0
- `grep -n "return\|logger" apps/web/modules/response-pipeline/lib/telemetry.ts` → `logger.debug(...)` only, no return
- vitest run → 1 passed (6ms), verified twice

## Notes
- Root cause of original defect: fabricated verification content not derived from artifact inspection. Corrected records now reflect the actual test/implementation as verified. Drawn from moderator + PURISTA persona execution.