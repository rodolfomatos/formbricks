---
sprint: sprint-02
period: 2026-07-01 → 2026-09-30
status: active
---

# Sprint 02 — Infrastructure + Audit Cleanup

## Goal
Fix remaining production bugs, complete the full codebase audit, and clean up all EE vestiges from the AGPL fork.

## Tickets
| ID | Title | Priority | Status |
|----|-------|----------|--------|
| T021 | Fix `withAuditLogging` `.catch` error in chunk `_0a_0a3e._.js` | high | done (2026-09-15) |
| T022 | Build infrastructure: cross-compile pipeline for 3.8 GB server | high | backlog |
| T023 | Redis AOF "No space left on device" — disk cleanup | high | done (2026-09-15) |
| T024 | Fix Prisma `getWorkspacePermissionByUserId` null/undefined args | medium | done (2026-09-15) |
| T025 | AES Verify phase: add "check full container logs" gate for hot-patch deploys | low | backlog |
| T051 | Verify gate: detect tracked-file imports referencing untracked paths (clone-break prevention) | high | done (2026-09-15) |
| T026 | Kill telemetry phone-home to ee.formbricks.com | blocker | done |
| T027 | Remove docker/.env from git tracking (false positive) | blocker | done |
| T028 | Fix root LICENSE to remove EE carve-out | blocker | done |
| T029 | Delete orphan modules/ directory at fork root | blocker | done |
| T030 | Commit critical untracked files (SAML SSO, Makefile, AES) | blocker | done |
| T031 | Eliminate ENTERPRISE_LICENSE_KEY across config/CI/locales | major | done |
| T032 | Update stale documentation referencing EE model | major | done |
| T033 | Clean up dead UpgradePrompt and enterpriseLicenseRequestFormUrl | major | done |
| T034 | Remove packages/design-system/ (foreign untracked package) | major | done |
| T035 | Fix AES sprint state and create T021-T025 ticket files | major | done |
| T037 | Update telemetry.test.ts to match neutered stubs | minor | done |
| T038 | Remove PendingDowngradeBanner dead code | minor | done |
| T039 | Clean up stale EE locale strings | minor | done |
| T040 | Eliminate ENTERPRISE_LICENSE_KEY (peer review M-1) | BLOCKER | done |
| T041 | Correct T037 fabricated verification record (M-2) | BLOCKER | done |
| T042 | Remove UpgradePrompt/PendingDowngradeBanner consumers (M-3) | MAJOR | done |
| T043 | Restore ModalButton export (M-4) | MAJOR | done |
| T044 | Fix 2FA enable wizard (M-5) | MAJOR | done |
| T045 | Correct SAML SSO docs (M-6) | MAJOR | done |
| T046 | Remove formbricks.com literal from telemetry comment (M-7) | MINOR | done |
| T047 | Arrow stubs → block body (M-8) | MINOR | done |
| T048 | Relative imports → @/modules alias (M-9) | MINOR | done |
| T049 | SAML AuthnRequest redirect fix (M-10) | MINOR | done |
| T050 | 2FA docs corrected to match implementation (M-11) | MINOR | done |

## Retrospective
*Filled at end of sprint.*

### What went well
- AGPL audit T026-T050 closed with zero open findings and an archived, independently-executed human validation (18/18, `human-validation.log` 2026-09-15).
- All four M-* classes handled: defused (T026-T029), rewritten (T044, T049), documented (T045, T050), margin (T046-T048).

### What went wrong
- `git ls-files vs on-disk` check was NOT part of verification: `saml-sso/lib/*` and `whitelabel/actions.ts` went untracked under `.gitignore:73 modules/` while their importers were committed — latent clone-break. Missed in the original 107-untracked sweep (T030) because the counts masked it.
- Reviewer-pre-registered greps (M-5/M-8/M-9) encoded assumptions about implementation idiom, producing false fails that had to be separated from real defects.
- T021's `.catch` errors in compiled chunks were initially attacked via fragile chunk hot-patches (T017): the real defect was the AGPL rewrite changing `queueAuditEvent`'s public signature from `(event)` to `(request, event)` while all 7 call sites kept passing a single event object. Root fix landed in `handler.ts` (single-event contract restored, `userType: "api"` → `apiKeyId`, oldObject/newObject/eventId/apiUrl persisted); CRC: with-api-logging, v3 api-wrapper, storage audit-logs, logger-helpers suites — 0 regressions vs pre-existing env failures.

### What to change next sprint
- Add a "no tracked file imports an untracked path" gate to Verify (diff `git ls-files` against on-disk under `apps/web/modules/`). *(done — GATE-UNTRACKED, T051)*
- When adding a .gitignore exclusion, verify it does not also exclude legitimately tracked-file importers; prefer scoped paths over bare directory rules.
- When rewriting a module, keep its exported function signatures contract-compatible with existing call sites — signature drift is invisible to `tsc --skipLibCheck` with ignoreBuildErrors and only surfaces as runtime errors in production chunks.
