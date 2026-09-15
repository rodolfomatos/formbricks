# CÍNICO Findings — AGPL-AUDIT-T026-T039

Persona bias: "Prove that we needed this / prove this is real." Findings below are based only on executed commands and file contents in this repository.

---

## [BLOCKER] ENTERPRISE_LICENSE_KEY is not zero — T031's "0 refs" claim is false and CI hard-requires the proprietary secret

Evidence:
- `cd /opt/forms/formbricks && grep -rn "ENTERPRISE_LICENSE_KEY" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=aes | wc -l` → **40** lines.
- `.github/workflows/e2e.yml:10-11` (`ENTERPRISE_LICENSE_KEY:` / `required: true`), `:77` (`sed -i "s/ENTERPRISE_LICENSE_KEY=.*/ENTERPRISE_LICENSE_KEY=${{ secrets.ENTERPRISE_LICENSE_KEY }}/" .env`), `:150-153` (`exit 1` if the key is empty).
- `turbo.json:262` (env pass-through), `.env.example:323` (`ENTERPRISE_LICENSE_KEY=` under a `# Enterprise License Key` comment), `docker/docker-compose.yml:70`.
- `aes/kanban.md:69` records T031 as `✅ DONE ... — 0 refs (real grep)`, which the above grep falsifies. The fork's e2e CI cannot run without Formbricks' private secret, so a fork CI run on a clean secrets scope aborts before any test executes.

Closure condition: `grep -rn "ENTERPRISE_LICENSE_KEY" . --exclude-dir=node_modules --exclude-dir=.git` returns 0 AND `.github/workflows/e2e.yml` contains no `required: true`/`exit 1` tied to `ENTERPRISE_LICENSE_KEY`.

Rubric criterion: S-01

---

## [MINOR] Pre-registered C-01 check fails literally: telemetry.ts still contains the endpoint string

Evidence: `grep -rn "formbricks.com" apps/web/modules/response-pipeline/lib/telemetry.ts` returns 1 line (`apps/web/modules/response-pipeline/lib/telemetry.ts:6`: "POSTed usage telemetry to https://ee.formbricks.com"). The pre-registered check (`C-01`, "returns 0 lines") does not pass as written. The function body is a logger.debug no-op (line 12-13) and `apps/web/modules/response-pipeline/lib/telemetry.test.ts` passes (verified, 1 test), so no request is sent — but the rubric's own verifiable command yields non-zero.

Closure condition: either `telemetry.ts` contains no `formbricks.com` substring, or the rubric C-01 check is amended (e.g. `grep -n "printToConsole\|http"`) and re-hashed; no endpoint string may remain in any code path that can execute.

Rubric criterion: C-01

---

## [MINOR] Pre-registered C-03/C-04 checks fail literally: null stubs use `=> null`, not `return null`

Evidence: `grep -rn "return null" apps/web/modules/ui/components/upgrade-prompt/index.tsx apps/web/modules/ui/components/pending-downgrade-banner/index.tsx` returns **0 lines**. Both files exist and neuter correctly — `apps/web/modules/ui/components/upgrade-prompt/index.tsx:27` is `export const UpgradePrompt = (_props: UpgradePromptProps) => null;` and `apps/web/modules/ui/components/pending-downgrade-banner/index.tsx:18` is `export const PendingDowngradeBanner = (_props: PendingDowngradeBannerProps) => null;`. Consumers still import/render them (e.g. `apps/web/app/(app)/workspaces/[workspaceId]/components/WorkspaceLayout.tsx:59`) and compile, so the intended behavior holds; the pre-registered verifiable checks do not execute as specified.

Closure condition: rubric C-03/C-04 check regex updated to `/=> null|return null/` and re-hashed, with a fresh run of both greps returning the stub lines.

Rubric criterion: C-03

---

## [MAJOR] UpgradePrompt/PendingDowngradeBanner "neutering" leaves the dead consumer graph and paywall copy fully wired — the audit keeps render-null stubs in production consumers that still advertise paid plans

Evidence: `grep -rn "UpgradePrompt" apps/web --include="*.tsx"` shows 6 live consumers beyond the module (e.g. `apps/web/modules/workspaces/components/workspace-limit-modal/index.tsx:5,21` renders `<UpgradePrompt title={t("common.unlock_more_workspaces_with_a_higher_plan")} ... feature="workspaces"/>`; `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/general/components/AISettingsToggle.tsx:99`). These components and their paywall copy remain in the shipped bundle — the audit closed T033/T038 as if the code paths were removed, but they are merely render-null at runtime; the i18n gate strings (`unlock_more_workspaces_with_a_higher_plan`) still ship to clients.

Closure condition: either the consumers are removed (grep shows no `UpgradePrompt`/`PendingDowngradeBanner` import outside the module definition) or the paywall copy strings are removed from `apps/web/locales/en-US.json`; verify with `grep -rn "unlock_more_workspaces_with_a_higher_plan" apps/web --include="*.json"` returning 0.

Rubric criterion: D-03