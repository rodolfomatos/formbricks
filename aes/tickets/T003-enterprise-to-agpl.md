---
ticket: T003
title: Convert EE features to AGPL (remove license gating)
sprint: sprint-01
priority: high
status: pending
created: 2026-06-28
---

# T003 — Convert Enterprise Features to AGPL

## Context

The Formbricks fork at `/opt/forms/formbricks/` aims to be fully AGPLv3-compliant, with no proprietary enterprise edition code or license enforcement. In a previous phase (T001), OIDC SSO was successfully converted from EE to AGPL by removing its dependency on the `license-check` module and implementing it as a first-class feature.

Approximately **386 source files** (~320+ unique files plus tests) live under `apps/web/modules/ee/`. These files implement legitimate AGPL-usable functionality (removing branding, white-labeling, teams, quotas, audit logs, etc.) but are gated behind a proprietary license check that phones home to `https://ee.formbricks.com/api/licenses/check`. The goal of this ticket is to neuter the license-gating layer while keeping all feature code intact and functional.

The gating mechanism is centralized in `apps/web/modules/ee/license-check/lib/utils.ts`, which exports ~20 `getIs*Enabled()` / `get*Permission()` functions. All callers across `apps/web/app/`, `apps/web/modules/`, and `apps/web/lib/` use these functions to decide whether to show a feature or render an `UpgradePrompt` instead. There are also self-hosted workspace-limit checks and a `getOrganizationWorkspacesLimit()` function that restricts workspace creation without an active license.

## Acceptance Criteria

- [ ] `license-check/lib/utils.ts` neutered: all `getIs*Enabled()` / `get*Permission()` functions return `true` (or sensible unlimited defaults)
- [ ] `license-check/lib/license.ts` made inert: `getEnterpriseLicense()` returns a synthetic active license; no HTTP calls to `ee.formbricks.com`
- [ ] `ENTERPRISE_LICENSE_KEY` removed from env schema (`lib/env.ts`) and constants (`lib/constants.ts`)
- [ ] All `if (!isFeatureEnabled) { throw / show UpgradePrompt }` gates removed across all EE feature files
- [ ] `UpgradePrompt` imports and usage removed from ~30+ components across EE features, survey modules, and workspace pages
- [ ] All 14 EE features (remove-branding, email-customization, role-management, teams, contacts, segments, quotas, unify-feedback, feedback-directories, dashboards/charts, audit-logs, ai-translation, spam-protection, two-factor-auth, multi-org, custom-onboarding) functional without license server
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes (existing tests updated)
- [ ] No EE license check code phones home to external servers

## Scope

**In scope:**
- All files in `apps/web/modules/ee/` that import from `license-check/lib/utils` — actions, pages, API routes, components
- The `license-check/` module itself (lib/license.ts, lib/utils.ts, types/ files)
- Callers outside `ee/` that import from `license-check/lib/utils` (in `app/`, `modules/`, `lib/`)
- The `UpgradePrompt` UI component usage sites
- `ENTERPRISE_LICENSE_KEY` references in env.ts, constants.ts, and test setup files
- `lib/constants.ts` entries related to IS_RECAPTCHA_CONFIGURED (if applicable)
- Response pipeline telemetry referencing `ENTERPRISE_LICENSE_KEY`

**Out of scope:**
- Billing/Stripe module (`modules/ee/billing/`) — cloud-only, not needed for self-hosted AGPL fork
- `modules/ee/mailing/` — cloud-only mailing infrastructure
- SAML SSO (not implemented in this fork)
- Modifying the Prisma schema (no migrations needed)
- Deleting EE source files — features stay, only gating is removed

## Dependencies

- T001 (SSO AGPL conversion) — provides pattern for how to handle license-check removal
- None external

## Rollback

- Revert changes to `apps/web/modules/ee/license-check/lib/` and `lib/env.ts` — these are the critical few files
- All other changes are mechanical removal of guard clauses; re-adding them is straightforward

## Known Risks

1. **Oversight**: A gate is missed, leaving a feature permanently blocked or throwing
2. **Build breaks**: Type errors from removed imports or changed return types
3. **Test failures**: Tests mock `license-check/lib/utils` functions and expect `false` — need updating
4. **Workspace limit regression**: `getOrganizationWorkspacesLimit()` returning `Infinity` may surprise users accustomed to the 3-workspace cap
5. **Spam protection gating**: `getIsSpamProtectionEnabled()` also checks `IS_RECAPTCHA_CONFIGURED` — if ReCaptcha env vars are absent, spam protection will be disabled regardless of license changes (expected behavior)
6. **Audit logs gating in handler**: The `withAuditLogging` wrapper in `audit-logs/lib/handler.ts` may silently skip or throw if it calls a gate function
7. **Test `vitestSetup.ts` references**: `ENTERPRISE_LICENSE_KEY` mocked in vitest setup must be removed or the env schema made optional

## Notes

- There are ~74 import sites from `license-check/lib/utils` across the codebase — each must be reviewed
- The `UpgradePrompt` component itself (`modules/ui/components/upgrade-prompt/index.tsx`) should be kept (it's a UI component) — only its callers need cleanup
- Some features (e.g., `contacts`, `analysis/dashboards`, `quotas`) have license checks deep in their own actions/pages; others (e.g., `remove-branding`, `two-factor-auth`) have checks only in external callers
- The `license-check` module also has entitlements-based logic for Formbricks Cloud (`IS_FORMBRICKS_CLOUD`). Since the fork targets self-hosted AGPL, the cloud paths can be left as-is or simplified — they won't be hit in production
