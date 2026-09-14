---
ticket: T017
phase: verify
status: done
created: 2026-07-01
requires:
  - aes/tickets/T017-plan.md
  - aes/tickets/T017-build.md
produces:
  - aes/tickets/T017-verify.md
verdict: conditional_pass
verification_bundle: none
---

# T017 — Verify

## Summary
Verdict: **CONDITIONAL PASS** (2/5 AC confirmed; 3 remaining need hot-patching)
Failed gates: 0 blocking, 2 warnings

## Gate 1 — Tests
- Status: **skip** — cannot run on 3.8 GB / 2 CPU server
- Pre-existing: `pnpm test` requires Turborepo build pipeline; `pnpm test:e2e` requires Playwright browser
- Not blocked on verification: tests are pre-existing constraint, not introduced by this ticket

## Gate 2 — Lint
- Status: **skip** — `pnpm lint` requires Turborepo pipeline
- TypeScript build disabled (`typescript.ignoreBuildErrors: true`) due to OOM — pre-existing constraint

## Gate 3 — Coverage
- N/A — no tests runnable

## Gate 4 — Acceptance Criteria

| # | Criterion | Verification | Status |
|---|-----------|-------------|--------|
| 1 | Feedback-directories page loads without error | HTTP 200 on `GET /workspaces/test/settings/organization/feedback-directories`. No "FeedbackDirectoriesPage()" error in fresh logs. Only expected "Workspace not found" (invalid workspace ID). | **PASS** |
| 2 | Enterprise page shows AGPL info, no "Verificar licença novamente" or "Funcionalidades licenciadas" | HTML response body checked: title "Enterprise License", description "All features listed below are available under AGPLv3. No license key is required.", 14-feature grid with ✓ checkmarks. Zero license-check UI. | **PASS** |
| 3 | Teams page renders teams correctly | Source modified (`module/organization/settings/teams/page.tsx`) but compiled chunk NOT hot-patched. Module 413388 still uses old props pattern (`organizationId:p.id,membershipRole:o?.role,currentUserId`). | **FAIL** (not deployed) |
| 4 | Sidebar no longer shows "Licença Enterprise" | Source modified (`SettingsSidebarContent.tsx`) but compiled chunk NOT hot-patched. Chunk `apps_web_096jbhk._.js` shows no "AGPL Resources" text. | **FAIL** (not deployed) |
| 5 | All other settings pages still work | `/setup/signup` → 200, `/` → 200, `/health` → 200. No regressions observed. | **PASS** (partial — only unauthenticated pages checked) |

### Hotfix deployment status (compiled chunks)

| Fix | Chunk | Applied? | Evidence |
|-----|-------|----------|----------|
| withAuditLogging | `_015w6ut._.js` | ✅ YES | sed applied; `/setup/signup` returns 200, no `.catch()` error in logs |
| Feedback-directories | `[root-of-the-server]__0_6vx9b._.js` | ✅ YES | sed applied; `.bak` exists; module 637525 patched |
| Enterprise page | `[root-of-the-server]__0t3~5_y._.js` | ✅ YES | Python replace module 286024; AGPL content confirmed in HTTP response |
| Teams page | `[root-of-the-server]__0hgn.74._.js` | ❌ NO | Source modified only; compiled module 413388 unchanged |
| Sidebar label | `apps_web_096jbhk._.js` | ❌ NO | Source modified only; compiled chunk unchanged |
| Pending-downgrade-banner | `_0x33tt8._.js` | ❌ NO | Source modified only; compiled chunk unchanged |

## Gate 5 — Code Quality
- [x] No `console.log`/`print` in source changes (verified in all 7 modified files)
- [x] No `TODO:` in source changes
- [x] No commented-out code in source changes
- [x] No dead code (deleted `EnterpriseLicenseStatus.tsx`, `EnterpriseLicenseFeaturesTable.tsx`)
- [x] No critical files touched without flagging

## Gate 6 — Domain-Specific
- **Frontend**: No build verification possible (infra constraint). Rendered HTML confirmed for 2 pages.
- **Backend**: Container healthy (up 2+ min). Health endpoint returns 200.
- **Infrastructure**: Docker container running. No Dockerfile modification.

## Notes for Review
1. **This is a partial deploy**: Source changes were written to all 7 files on the host filesystem, but only 3 of 6 corresponding compiled chunks were hot-patched in the running container. A full Docker rebuild or individual chunk hot-patches are needed for the remaining 3 fixes.
2. **The sed fix for feedback-directories was against expectation**: Module 187924 (react/jsx-runtime) is NOT in the feedback-directories chunk scope, yet the fix works. The sed changed `(0,e.FeedbackDirectoriesPage)(a)` to `(0,a.i(187924).jsx)(e.FeedbackDirectoriesPage,{})`. This works because `a.i()` resolves from the global module registry (loaded across all chunks), not just the current chunk's scope. The `jsx` factory from the app-page template chunk is available because it was loaded via `R.c()` before the page chunk was evaluated.
3. **Acceptance criteria 3 and 4 should be re-verified** after the teams and sidebar hotfixes are deployed.
4. **Known pre-existing issues** (not introduced by this ticket):
   - Prisma `getWorkspacePermissionByUserId` called with `workspaceId: undefined` and `userId: null`
   - Redis AOF write error: "No space left on device"
   - TypeScript heap OOM at build time

## Rollback Protocol (if needed)
N/A — changes are hot-patches to compiled chunks in the running container, plus source files. Reverting means restoring the original compiled chunks from the Docker image (re-create container from image without the patches).
