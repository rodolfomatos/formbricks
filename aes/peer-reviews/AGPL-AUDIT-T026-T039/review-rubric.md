---
rubric-id: AGPL-AUDIT-T026-T039-2026-09-11
candidate: AGPL audit round T026-T039 — Formbricks community fork (commits 86e851868, 100840f69, a89a7d527)
created: 2026-09-11
dimensions:
  - correctness
  - security
  - coherence
  - debt
  - reproducibility
  - usability
---

# Review Rubric — AGPL-AUDIT-T026-T039

**Pre-registered before any persona reviewed the candidate.**
Hash recorded in `aes/peer-reviews/AGPL-AUDIT-T026-T039/rubric-hash`.
Any post-hoc edit invalidates the review.

## Correctness

| ID | Criterion | Verifiable Check |
|----|-----------|-----------------|
| C-01 | telemetry.ts is a no-op (no phone-home to formbricks.com / ee.formbricks.com) | `grep -rn "formbricks.com" apps/web/modules/response-pipeline/lib/telemetry.ts` returns 0 lines |
| C-02 | telemetry.test.ts asserts the no-op and passes | `cd apps/web && NODE_OPTIONS="--max_old_space_size=3072" pnpm exec dotenv -e ../../.env -- pnpm exec vitest run modules/response-pipeline/lib/telemetry.test.ts` exits 0 |
| C-03 | UpgradePrompt renders null, signature preserved | `grep -rn "return null" apps/web/modules/ui/components/upgrade-prompt/index.tsx` returns the null line, and file exports `UpgradePrompt` |
| C-04 | PendingDowngradeBanner renders null, consumer compiles | `grep -rn "return null" apps/web/modules/ui/components/pending-downgrade-banner/index.tsx` returns null line; `grep -rn "PendingDowngradeBanner" apps/web --include="*.tsx"` shows only the module def + WorkspaceLayout consumer |
| C-05 | No broken imports from deleted modules/ | `grep -rn "from \"@/modules/ee\|from \"modules/ee" apps/web --include="*.ts*"` resolves to existing files (spot-check 5) |
| C-06 | License stub gates return true / features enabled | `grep -rn "active: true\|return true" apps/web/modules/ee/license-check/lib/license.ts` |

## Security

| ID | Criterion | Verifiable Check |
|----|-----------|-----------------|
| S-01 | Zero ENTERPRISE_LICENSE_KEY anywhere (real grep) | `grep -rn "ENTERPRISE_LICENSE_KEY" . --exclude-dir=node_modules --exclude-dir=.git` returns 0 |
| S-02 | No committed secrets in the 3 commits (tokens, private keys) | `git show --stat --name-only 86e851868 100840f69 a89a7d527 | grep -iE "\.env|cert|secret|key"` shows only `docker/.env.example` (empty placeholders) and no credential-bearing files |
| S-03 | No phone-home endpoints added/left | `grep -rn "ee.formbricks.com\|app.formbricks.com" apps/web --include="*.ts*" | grep -v "locales\|test"` returns 0 (or only documented/disabled refs) |
| S-04 | docker/.env.example has no real secrets | `grep -nE "POSTGRES_PASSWORD|NEXTAUTH_SECRET|ENCRYPTION_KEY" docker/.env.example` values are empty placeholders |

## Coherence (Epistemic)

| ID | Criterion | Verifiable Check |
|----|-----------|-----------------|
| E-01 | Enterprise settings page states AGPL-no-key reality | `grep -n "All features are available" "apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/enterprise/page.tsx"` |
| E-02 | Docs no longer claim EE license gates | `grep -rln "requires an enterprise\|Enterprise-only\|enterprise license required" apps/docs/docs apps/web/app --include="*.mdx" --include="*.mdx"` returns 0 (warnings about changelog/history excluded) |
| E-03 | LICENSE has no EE carve-out | `grep -n "enterprise\|Enterprise" LICENSE` returns no carve-out clause |
| E-04 | kanban.md statuses match actual work | `grep -c "✅ DONE" aes/kanban.md` equals number of T026-T039 tickets marked done (14) |

## Debt

| ID | Criterion | Verifiable Check |
|----|-----------|-----------------|
| D-01 | modules/ root deleted and gitignored | `test ! -d modules && grep -q "^modules/$" .gitignore` |
| D-02 | packages/design-system/ deleted and gitignored | `test ! -d packages/design-system && grep -q "packages/design-system/" .gitignore` |
| D-03 | NO dead UpgradePrompt/PendingDowngradeBanner code paths render | `grep -rn "UpgradePrompt\b" apps/web/modules/ui/components/upgrade-prompt/index.tsx` exports only the null stub (no internal render) |
| D-04 | No duplicated/legacy orphan code left behind by T029 | `grep -rn "modules/" apps/web --include="*.ts*" | grep -v "@/modules\|node_modules"` returns 0 (no `../../modules/` legacy imports) |

## Reproducibility

| ID | Criterion | Verifiable Check |
|----|-----------|-----------------|
| R-01 | vitest telemetry test reproducible | (same command as C-02) passes twice in a row |
| R-02 | git tree clean (uncommitted = aes/ only, intentional) | `git status --short` shows `?? aes/` at most |
| R-03 | Feature flags/env keys referenced exist in env spec | `grep -n "SAML_\|ENCRYPTION_KEY\|NEXTAUTH_SECRET" apps/web/lib/env.ts` (SAML vars present) |

## Usability

| ID | Criterion | Verifiable Check |
|----|-----------|-----------------|
| U-01 | Settings pages for EE features render without asking for license | `grep -rln "license key\|Upgrade to unlock\|enterprise license" apps/web/app/\(app\)/workspaces --include="*.tsx"` returns 0 in rendered paths (excluding settings/enterprise copy which now says AGPL) |
| U-02 | No dead-upgrade dead-ends (clicking feature page does not show paywall) | spot-check: no `UpgradePrompt` rendered in any consumer |

---
pre-registered-hash: computed and recorded in ../rubric-hash at creation (2026-09-11), before any persona saw the candidate