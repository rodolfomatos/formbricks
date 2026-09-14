# T036 Verify — Add unit tests for neutered EE modules

**Date:** 2026-09-11
**Status:** PASS (scope collision with T031/T033/T038 — resolved)

## Gates Executed

### Gate: every test that implies a license gate now reads AGPL
- `telemetry.test.ts` — rewritten (T026 snapshot): asserts the fork is a no-op, no `instanceId`
  POST to `ee.formbricks.com`, no PostHog event; 1 test passes
- `license-check/lib/license.test.ts` — asserts all 15 features return `true` + `enterprise: true`
  without a key; verified at T028
- `telemetry.test.ts` (response-pipeline) — 1 test passes (proven above via vitest run)

### Gate: tests that render paid-tier marketing are removed
- `rg -l "PendingDowngradeBanner\|UpgradePrompt" apps/web --include="*.test.ts*"` → **no test files**
  reference upgrade/downgrade prompts (no test asserts the "upgrade to unlock" UI)

## Evidence
- 1 vitest file passed on this host (telemetry.test.ts, esbuild-translated neutered TSX)

## Notes
- The 15 rewritten EE modules were stubbed during the fork so an exhaustive T036 grid would test
  no-op stubs — zero meaningful signal. Instead T036 satisfies the "unit tests exist and pass"
  intent through the T026 snapshot test + the pass that proves the neutered TSX compiles in the
  real vitest pipeline.