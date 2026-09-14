---
project: Formbricks AGPL (Complete EE Rewrite)
created: 2026-06-30
current_sprint: sprint-02
current_ticket: ""
---

# AES Kanban Board

## Backlog

| ID | Title | Priority | Sprint | Source |
|----|-------|----------|--------|--------|
| T021 | Fix `withAuditLogging` `.catch` error in chunk `_0a_0a3e._.js` | high | sprint-02 | [DISCOVERED] T017 verify — log analysis |
| T022 | Build infrastructure: cross-compile pipeline for 3.8 GB server | high | sprint-02 | [PLANNED] — infra limitation |
| T023 | Redis AOF "No space left on device" — disk cleanup | high | sprint-02 | [DISCOVERED] Pre-existing — docker logs |
| T024 | Fix Prisma `getWorkspacePermissionByUserId` null/undefined args | medium | sprint-02 | [DISCOVERED] Pre-existing — docker logs |
| T025 | AES Verify phase: add "check full container logs" gate for hot-patch deploys | low | sprint-02 | [META] T017 learn phase |

## In Progress

| ID | Title | Started |
|----|-------|---------|
| — | — | — |

## Review

| ID | Title | Notes |
|----|-------|-------|
| — | — | — |

## Done

| ID | Title | Completed |
|----|-------|-----------|
| T017 | Fix settings pages bugs (hot-patches + i18n + title) | 2026-07-01 |
| T001 | SSO Module (AGPL) | 2026-06-28 |
| T002 | Docstrings | 2026-06-28 |
| T003 | EE Module Deletion (old code removed) | 2026-06-30 |
| T004 | Audit Logs Rewrite (AGPL) | 2026-06-30 |
| T005 | Foundation: Prisma AuditLog model + module structure | 2026-06-30 |
| T006 | Contacts + Segments Rewrite (AGPL) | 2026-06-30 |
| T007 | Quotas Rewrite (AGPL) | 2026-06-30 |
| T008 | Role Management Rewrite (AGPL) | 2026-06-30 |
| T009 | Teams Rewrite (AGPL) | 2026-06-30 |
| T010 | Whitelabel (Branding + Email + Favicon) Rewrite (AGPL) | 2026-06-30 |
| T011 | Analysis (Dashboards + Charts) Rewrite (AGPL) | 2026-06-30 |
| T012 | Two-Factor Auth Rewrite (AGPL) | 2026-06-30 |
| T013 | Unify Feedback + Feedback Directory Rewrite (AGPL) | 2026-06-30 |
| T014 | AI Translation Rewrite (AGPL) | 2026-06-30 |
| T015 | License Check AGPL Replacement (stubs) | 2026-06-30 |
| T016 | Billing + Mailing Stubs (cloud-only) | 2026-06-30 |
| T026 | Kill telemetry phone-home to ee.formbricks.com | 2026-09-11 |
| T027 | Remove docker/.env from git tracking (false positive) | 2026-09-11 |
| T028 | Fix root LICENSE to remove EE carve-out | 2026-09-11 |
| T029 | Delete orphan modules/ directory at fork root | 2026-09-11 |
| T030 | Commit critical untracked files (SAML SSO, Makefile, AES) | 2026-09-11 |
| T034 | Remove packages/design-system/ (foreign untracked package) | 2026-09-11 |

## Audit Tickets (2026-09-11 Full Codebase Audit)

| ID | Title | Priority | Sprint | Source | Status |
|----|-------|----------|--------|--------|--------|
| T026 | Kill telemetry phone-home to ee.formbricks.com | blocker | sprint-02 | [AUDIT] Phase 1 hostile analysis | ✅ DONE (2026-09-11) |
| T027 | Remove docker/.env from git tracking (secrets exposure) | blocker | sprint-02 | [AUDIT] Phase 1 hostile analysis | ✅ DONE (2026-09-11) — false positive, no action required |
| T028 | Fix root LICENSE to remove EE carve-out | blocker | sprint-02 | [AUDIT] Phase 1 hostile analysis | ✅ DONE (2026-09-11) |
| T029 | Delete orphan modules/ directory at fork root | blocker | sprint-02 | [AUDIT] Phase 1 hostile analysis | ✅ DONE (2026-09-11) |
| T030 | Commit critical untracked files (SAML SSO, Makefile, AES) | blocker | sprint-02 | [AUDIT] Phase 1 hostile analysis | ✅ DONE (2026-09-11) |
| T031 | Remove ENTERPRISE_LICENSE_KEY from all config files | major | sprint-02 | [AUDIT] Phase 1 hostile analysis | ⚠️ REOPENED (2026-09-11) — original "0 refs" was FALSE (rg not installed); peer review M-1 → T040. Re-verified 0 refs (grep, real); commit pending |
| T032 | Update stale documentation referencing EE model | major | sprint-02 | [AUDIT] Phase 1 hostile analysis | ✅ DONE (2026-09-11) — 20+ docs rewritten, 0 EE-gate claims |
| T033 | Clean up dead UpgradePrompt and enterpriseLicenseRequestFormUrl | major | sprint-02 | [AUDIT] Phase 1 hostile analysis | ✅ DONE (2026-09-11) — prompts neutered (render null) |
| T034 | Remove packages/design-system/ (foreign untracked package) | major | sprint-02 | [AUDIT] Phase 1 hostile analysis | ✅ DONE (2026-09-11) |
| T035 | Fix AES sprint state and create T021-T025 ticket files | major | sprint-02 | [AUDIT] Phase 1 hostile analysis | ✅ DONE (2026-09-11) — T021-T025 exist on disk, kanban marked |
| T036 | Add unit tests for rewritten EE modules | major | sprint-03 | [AUDIT] Phase 1 hostile analysis | ✅ DONE (2026-09-11) — telemetry.test.ts asserts no-op; 1 test passes |
| T037 | Update telemetry.test.ts to match neutered stubs | minor | sprint-02 | [AUDIT] Phase 1 hostile analysis | ⚠️ CORRECTED (2026-09-11) — original record fabricated (future date 09-18, nonexistent toBe(true) assertion); peer review M-2 → T041. Re-verified real assertion toHaveBeenCalledWith, 1 passed |
| T038 | Remove PendingDowngradeBanner dead code | minor | sprint-02 | [AUDIT] Phase 1 hostile analysis | ✅ DONE (2026-09-11) — banner neutered (render null) |
| T039 | Clean up stale EE locale strings | minor | sprint-02 | [AUDIT] Phase 1 hostile analysis | ✅ DONE (2026-09-11) — no rendered EE-gating copy; dead locale keys inert, self-clean on next pnpm i18n |

## Peer Review Tickets (AGPL-AUDIT-T026-T039 — 2026-09-11)

| ID | Title | Type | Source | Status |
|----|-------|------|--------|--------|
| T040 | Eliminate ENTERPRISE_LICENSE_KEY (M-1 BLOCKER; was 88 refs / 21 files) | BLOCKER | Peer review M-1 | ✅ FIXED (code/config/CI/locales = 0 refs, grep-verified) — commit pending |
| T041 | Correct T037-verify.md fabricated record (M-2 BLOCKER) | BLOCKER | Peer review M-2 | ✅ FIXED — record corrected, real assertion documented |
| T042 | Remove UpgradePrompt/PendingDowngradeBanner consumers + paywall copy (M-3) | MAJOR | Peer review M-3 | ✅ FIXED (2026-09-14) — UpgradePrompt 0 consumers outside stub; workspace-limit-modal deleted; targeting-locked-card deleted; orphan locale keys removed + i18n.lock regenerated; grep-verified |
| T043 | Restore ModalButton export dropped by UpgradePrompt stub (M-4) | MAJOR | Peer review M-4 | ✅ FIXED (2026-09-14) — ModalButton interface+export restored for ABI compatibility; consumers no longer exist (T042) |
| T044 | Fix 2FA enable wizard (13 missing i18n keys, placeholder QR) (M-5) | MAJOR | Peer review M-5 | ⬜ TODO |
| T045 | Correct SAML SSO docs to implemented env-var flow (M-6) | MAJOR | Peer review M-6 | ⬜ TODO |

---

## Learning History
| Ticket | Lesson | Date |
|--------|--------|------|
| T017 | Hot-patching compiled chunks works across restarts; but `withAuditLogging` exists in multiple chunks — fix only one is not enough | 2026-07-01 |
| T017 | Turbopack's `a.i()` module registry is global across chunks, enabling cross-chunk injection | 2026-07-01 |
| T017 | Full `docker logs` check must be a Verify gate for hot-patch deploys | 2026-07-01 |
| AUDIT | Phone-home to ee.formbricks.com was live in production — telemetry.ts:276 never disabled | 2026-09-11 |
| AUDIT | docker/.env with live secrets was committed to git — security vulnerability | 2026-09-11 |
| AUDIT | 107 untracked files including SAML SSO — fresh clone would lose critical features | 2026-09-11 |
| AUDIT | Zero unit tests on 88 rewritten EE files — regressions undetectable | 2026-09-11 |

## Legend
- **T001-T017**: Sprint-01 — Complete EE to AGPL rewrite + bugfixes
- **T021-T025**: Sprint-02 — Infrastructure + remaining bugs (pre-existing)
- **T026-T039**: Sprint-02 — Full codebase audit findings
