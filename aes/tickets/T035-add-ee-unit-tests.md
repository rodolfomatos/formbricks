# T036 Add — Unit tests for AGPL fork telemetry + telemetry stub

**Date:** 2026-09-11
**Status:** RESOLVED (as part of T026/T037 neutralization commons — see T026-verify, T037-verify, T036-verify)

## Solution (neutering commons, T033-approach)
The telemetry test file `telemetry.test.ts` was rewritten as part of the T026 telemetry
neutering to assert the **fork behavior** (no-op stub returns `true` via + global rhe signal),
not the upstream phone-home behavior. Run: `vitest run .../telemetry.test.ts` → **1 test, pass**.

Same approach applied T037 (SAML stub file) — covered at T037.

## Evidence of pass
- `vitest run apps/web/modules/response-pipeline/lib/telemetry.test.ts` → 1 passed (6ms)
- `telemetry.test.ts` now references the neutered `sendTelemetryEvents` stub + the event-log export
- no `ee.formbricks.com` / `usage-updates` payload assertions in either test
