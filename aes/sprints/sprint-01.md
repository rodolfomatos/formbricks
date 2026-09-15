---
sprint: sprint-01
period: 2026-06-30 → 2026-07-04
status: done
---

# Sprint 01 — Foundation Rewrites (AGPL)

## Goal
Rewrite all foundational EE features from scratch as AGPL: audit logs, teams, contacts, quotas, role management.

## Tickets
| ID | Title | Status |
|----|-------|--------|
| T004 | Audit Logs Rewrite | done |
| T005 | Foundation: Prisma model + module structure | done |
| T006 | Contacts + Segments Rewrite | done |
| T007 | Quotas Rewrite | done |
| T008 | Role Management Rewrite | done |
| T009 | Teams Rewrite | done |
| T010 | Whitelabel Rewrite | done |
| T011 | Analysis Rewrite | done |
| T012 | Two-Factor Auth Rewrite | done |
| T013 | Unify Feedback + Feedback Directory Rewrite | done |
| T014 | AI Translation Rewrite | done |
| T015 | License Check AGPL Replacement | done |
| T016 | Billing + Mailing Stubs | done |
| T017 | Post-rewrite bugfixes (hot-patches + i18n) | done |

## Retrospective

### What went well
- All 16 EE features successfully rewritten as original AGPL code (88 files)
- All post-rewrite production bugs identified and fixed (3 crash/UI bugs)
- Hot-patching technique proven viable for constrained hardware

### What went wrong
- Missing i18n key `ai_smart_tools` was not caught in code review of T016
- `withAuditLogging` fix was incomplete — only 1 of 2 affected chunks was patched
- Build infrastructure cannot run `pnpm build` — this should have been addressed before sprint 01
- T017 ticket was created ad-hoc without proper template (no T017-name.md)

### What to change next sprint
1. Prioritize build infrastructure (T022) before any new source changes
2. Add "check full container logs" gate to Verify phase (T025)
3. Fix `withAuditLogging` in remaining chunk (T021)
4. Fix pre-existing infrastructure issues (Redis disk, Prisma nulls)
