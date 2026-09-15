# Purista / Integrity — Findings — AGPL-AUDIT-T026-T039

Persona: PURISTA (integrity above all). Findings below were produced only from
commands executed inside this repository on 2026-09-11; every claim is backed by a
command output, path, or commit hash.

---

## [BLOCKER] ENTERPRISE_LICENSE_KEY still present in 21 committed files; T031 "0 refs" claim is false

Evidence: `grep -rn "ENTERPRISE_LICENSE_KEY" . --exclude-dir=node_modules --exclude-dir=.git` (the pre-registered S-01 check) returns matches in 21 files outside `aes/`: `.github/workflows/e2e.yml` (declares `secrets: ENTERPRISE_LICENSE_KEY: required: true`, fills `.env` via sed, and fails the job when empty), `turbo.json:262`, `.env.example:323` (`ENTERPRISE_LICENSE_KEY=` with header comment "# Enterprise License Key"), `charts/formbricks/templates/secrets.yaml:47` (`ENTERPRISE_LICENSE_KEY: {{ .Values.enterprise.licenseKey | b64enc }}`), 15 files under `apps/web/locales/*.json`, `docs/self-hosting/advanced/license-activation.mdx:11`, `docker/docker-compose.yml:70`. `git show HEAD:.env.example | sed -n 323p` confirms the var is committed, and commit `86e851868` modified `.env.example` yet left it in place. kanban.md:69 records `T031 ... ✅ DONE ... 0 refs (real grep)`; T031-verify.md records "Empty result sets" and "no ENTERPRISE_LICENSE_KEY entry" in `.env.example` — both falsified by the above. `which rg` exits 1, so T031-verify's quoted gate (`rg -l "ENTERPRISE_LICENSE_KEY" → (empty)`) could not have run on this host; reproduced with grep it is non-empty. This also conflicts with CLAUDE.md Never-Do ("Use ENTERPRISE_LICENSE_KEY anywhere").

Closure condition: `grep -rn "ENTERPRISE_LICENSE_KEY" . --exclude-dir=node_modules --exclude-dir=.git` exits 1 in this repository, and the T031 kanban/verify record is amended to state the actual pre-cleanup count (21 files).

Rubric criterion: S-01

---

## [BLOCKER] T037-verify.md is future-dated and asserts behavior that does not exist

Evidence: `aes/tickets/T037-verify.md` header reads `**Date:** 2026-09-18`; the system date is 2026-09-11 (`date` → `Fri Sep 11 ... 2026`) and the file mtime is `Sep 11 17:20`, so the documented verification date cannot have occurred. The same file states the test asserts `expect(await sendTelemetryEvents({...})).toBe(true)` "matching `telemetry.ts` which returns `true` immediately". Verified against the artifacts: `apps/web/modules/response-pipeline/lib/telemetry.test.ts:29` asserts `expect(logger.debug).toHaveBeenCalledWith("Telemetry disabled in AGPL fork — no-op")`; there is no `.toBe(true)` anywhere in the test, and `telemetry.ts` has no `return` statement (returns `undefined`). kanban.md:75 marks T037 `✅ DONE (2026-09-11)` on the strength of this record. The recorded verification is therefore contradicted by the files it claims to document.

Closure condition: T037-verify.md is corrected to (a) the real execution date 2026-09-11 and (b) the actual assertion (`logger.debug` `toHaveBeenCalledWith`), and it must not state `telemetry.ts` returns a `true` sentinel; kanban T037 status is re-verified against the corrected record.

Rubric criterion: E-04

---

## [MAJOR] U-02 does not hold: UpgradePrompt is still invoked by 6 consumer files, and T033-verify's "8 consumers" is not reproducible

Evidence: `grep -rn "<UpgradePrompt\|UpgradePrompt\b" apps/web --include="*.tsx"` (excluding the stub) finds render sites in `apps/web/app/(app)/workspaces/[workspaceId]/surveys/[surveyId]/(analysis)/summary/components/shareEmbedModal/personal-links-tab.tsx:164`, `.../settings/organization/general/components/AISettingsToggle.tsx:99`, `apps/web/modules/workspaces/components/workspace-limit-modal/index.tsx:21`, `apps/web/modules/organization/settings/teams/components/invite-member/bulk-invite-tab.tsx:124`, `apps/web/modules/survey/editor/components/targeting-locked-card.tsx:49`, `apps/web/modules/survey/follow-ups/components/follow-ups-view.tsx:52` — 6 consumer files. The pre-registered U-02 check ("no UpgradePrompt rendered in any consumer") is therefore false as literally specified; the call sites still pass `feature`/`buttons` gating props to a component that discards them. T033-verify.md states "8 consumers", which the installed grep cannot reproduce (6 files). The dead call sites are disclosed, but the criterion fails as written and the count is wrong.

Closure condition: the 6 consumer call-sites and their `UpgradePrompt` imports are removed (or T033's "8 consumers" is corrected to 6), and `grep -rn "UpgradePrompt" apps/web --include="*.tsx"` then matches only `apps/web/modules/ui/components/upgrade-prompt/index.tsx`.

Rubric criterion: U-02

---

## [MINOR] Pre-registered C-03/C-04 checks (`grep -rn "return null"`) fail against both delivered stubs

Evidence: `grep -rn "return null" apps/web/modules/ui/components/upgrade-prompt/index.tsx apps/web/modules/ui/components/pending-downgrade-banner/index.tsx` exits 1 with zero matches. Both files implement the null return as arrow shorthand — `export const UpgradePrompt = (_props: UpgradePromptProps) => null;` (upgrade-prompt/index.tsx:27) and `export const PendingDowngradeBanner = (_props: PendingDowngradeBannerProps) => null;` (pending-downgrade-banner/index.tsx:18). The pre-registered checks C-03 and C-04, quoted verbatim in the rubric, can never pass against the delivered implementation, so the gate as pre-registered and the implementation are unreconciled: a reviewer executing the exact check gets FAIL for both, while T033/T038-verify record PASS.

Closure condition: either the stubs are changed so the literal `grep -rn "return null"` matches (e.g., block body `{ return null; }`) or the pre-registered checks are amended to the existing `=> null` pattern, and both checks are re-run to record-pass on this host.

Rubric criterion: C-03

---

## [MINOR] C-01 check fails: telemetry.ts still contains "ee.formbricks.com"

Evidence: the pre-registered C-01 command `grep -rn "formbricks.com" apps/web/modules/response-pipeline/lib/telemetry.ts` returns 1 line (line 6: comment `The original Formbricks code POSTed usage telemetry to https://ee.formbricks.com`); the check requires 0 lines. The code does not phone home (function body is only `logger.debug(...)`), so S-03's "only documented refs" allowance is met, but the literal C-01 gate as pre-registered does not pass, and T026-verify.md records the gate as satisfied without noting the residual match. Leaving a live URL string in a file asserted to be a "0 refs" no-op leaves an unexplained discrepancy for any agent that greps for phone-home endpoints.

Closure condition: `grep -rn "formbricks.com" apps/web/modules/response-pipeline/lib/telemetry.ts` exits 1 (URL removed or the line documented as part of the test/gate record), and T026-verify.md is updated to state the single comment ref was removed or accepted.

Rubric criterion: C-01

---

Verdict: REJECT. Two blockers — the T031 "0 refs" kanban/verify record is falsified by 21 committed files the audit itself left in place (including a CI workflow that fails the build if the license secret is absent), and the T037 verification record is future-dated and describes an assertion that does not exist in the artifact. Either the audit is completed for real, or the claims must be corrected; do not record DONE for work not done.