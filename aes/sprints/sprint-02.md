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
| T021 | Fix `withAuditLogging` `.catch` error in chunk `_0a_0a3e._.js` | high | backlog |
| T022 | Build infrastructure: cross-compile pipeline for 3.8 GB server | high | backlog |
| T023 | Redis AOF "No space left on device" — disk cleanup | high | backlog |
| T024 | Fix Prisma `getWorkspacePermissionByUserId` null/undefined args | medium | backlog |
| T025 | AES Verify phase: add "check full container logs" gate for hot-patch deploys | low | backlog |
| T026 | Kill telemetry phone-home to ee.formbricks.com | blocker | pending |
| T027 | Remove docker/.env from git tracking (secrets exposure) | blocker | pending |
| T028 | Fix root LICENSE to remove EE carve-out | blocker | pending |
| T029 | Delete orphan modules/ directory at fork root | blocker | pending |
| T030 | Commit critical untracked files (SAML SSO, Makefile, AES) | blocker | pending |
| T031 | Remove ENTERPRISE_LICENSE_KEY from all config files | major | pending |
| T032 | Update stale documentation referencing EE model | major | pending |
| T033 | Clean up dead UpgradePrompt and enterpriseLicenseRequestFormUrl | major | pending |
| T034 | Remove packages/design-system/ (foreign untracked package) | major | pending |
| T035 | Fix AES sprint state and create T021-T025 ticket files | major | pending |
| T037 | Update telemetry.test.ts to match neutered stubs | minor | pending |
| T038 | Remove PendingDowngradeBanner dead code | minor | pending |
| T039 | Clean up stale EE locale strings | minor | pending |

## Retrospective
*Filled at end of sprint.*

### What went well
*(pending)*

### What went wrong
*(pending)*

### What to change next sprint
*(pending)*
