# T003 Plan — Enterprise to AGPL Conversion

## Phase 1: Hostile Analysis

### Assumptions

1. **All EE feature code is AGPL-compatible.** The code in `apps/web/modules/ee/` is assumed to be copyright Formbricks GmbH and licensed under their standard AGPL terms, with the EE-only restriction enforced solely by the `license-check` module. If any file contains proprietary third-party code or different licensing headers, this could cause legal issues even after gating removal.

2. **Cloud-only billing code won't affect self-hosted.** The `modules/ee/billing/` and `modules/ee/mailing/` directories contain Stripe/customer-portal logic gated behind `IS_FORMBRICKS_CLOUD` checks. These are being left untouched — a safe assumption since the fork targets self-hosted AGPL, but if someone runs `IS_FORMBRICKS_CLOUD=true` with stale billing secrets, errors could surface.

3. **No other license-gating mechanisms exist.** The analysis assumes all gating flows through `license-check/lib/utils.ts`. However, there may be secondary gates in environment variable checks, middleware, or API route interceptors that also enforce EE restrictions.

4. **Callback/return-type compatibility.** Changing `getIs*Enabled()` to always return `true` is assumed to be compatible with all callers. If any caller uses the result to derive a different type (e.g., string union of plan names), a boolean `true` could break that code path.

5. **Test mocks are the only test impact.** Tests mock these functions with `vi.fn().mockResolvedValue(false)` — changing to `true` means test expectations about feature denial will fail.

### Missing Specs

1. **What happens to the billing/Stripe module?** While it's "out of scope" for this ticket, there's no clear guidance on whether it should be removed, stubbed, or left untouched. The plan says "leave it" — but it imports from `license-check/lib/utils` indirectly through entitlements code.

2. **What about `modules/entitlements/`?** The file `modules/entitlements/lib/checks.ts` and `provider.ts` are imported by `license-check/lib/utils.ts`. These may have their own gating or Cloud-specific logic that needs review.

3. **How should workspace limits behave?** `getOrganizationWorkspacesLimit()` currently returns `3` for self-hosted without a license. After neutering, it would return `Infinity` (or `null`). This changes UX behavior — users expecting a 3-workspace cap will suddenly have unlimited workspaces.

4. **What about the `lib/response/service.ts` quota enforcement?** Quotas have runtime enforcement (response counting, blocking). If quotas are "enabled" but no quota limits are configured, what happens? This could result in unlimited response collection with no enforcement, which might be the desired behavior but should be explicit.

5. **What about `IS_RECAPTCHA_CONFIGURED` for spam protection?** Spam protection has a two-stage gate: (a) is ReCaptcha configured via env var? (b) is the feature licensed? After neutering (b), (a) still applies. This is correct behavior but should be documented.

### Alternatives Not Chosen

- **Delete the license-check module entirely.** Deleting would cause 74+ import sites to break, requiring every caller to be rewritten. Neutering (return `true`) is surgical and minimizes diff.
- **Replace with a no-op license server.** Running a local `ee.formbricks.com` stub would preserve architecture but add operational complexity for zero benefit.
- **Feature flags.** Using a config file to toggle features instead of hardcoding `true` — over-engineered for a fork; keep it simple.
- **Retaining the license check but skipping the HTTP call.** The `getEnterpriseLicense()` function already has a `no-license` fallback that returns all features disabled. We must invert this default.

### Risks (Probability × Impact)

| Risk | P | I | Score | Mitigation |
|------|---|---|-------|------------|
| Missed gate leaves feature broken | Medium | High | High | Exhaustive grep of every `getIs*`/`get*Permission` call site; verify each in code review |
| Build breaks from type errors | Low | High | Medium | Run `pnpm build` after each feature batch, not just at end |
| Test suite broken at scale | High | Medium | Medium | Update test mocks in batch; run `pnpm test` after each feature |
| Entitlements context provider fails | Low | High | Medium | Check `getOrganizationEntitlementsContext()` is not called in a way that crashes without license |
| UpgradePrompt component still referenced | Low | Low | Low | Components will compile fine; UX may show upgrade prompts that can never be dismissed |
| Workspace limit infinity causes UX issues | Medium | Low | Low | Acceptance criteria to check workspace creation page behavior |
| Spam protection silently disabled | Low | Low | Low | Document that `VAPID_KEY`/ReCaptcha env vars are still required |

---

## Phase 2: Two-Agent Analysis (AES-Heavy)

### Critic Analysis

**Failure Mode 1: Cascade failure from neutered cache keys.**
`getCacheKeys()` in `license.ts` uses `hashString(env.ENTERPRISE_LICENSE_KEY)` to build Redis cache keys. If `ENTERPRISE_LICENSE_KEY` is removed from env but the env schema still requires it, the entire app will crash at startup. If the schema makes it optional but `getCacheIdentifier()` hits `env.ENTERPRISE_LICENSE_KEY` access, it could throw or return `undefined`, producing a broken Redis key.

**Failure Mode 2: `withAuditLogging` higher-order function silently succeeds with no-op audit.**
The `withAuditLogging` wrapper in `audit-logs/lib/handler.ts` may call `getIsAuditLogsEnabled()` internally. If that gate returns `true` but the underlying audit logging infrastructure (DB tables, prisma models) expects a license-backed write path, audit records may silently fail to write.

**Failure Mode 3: Quota enforcement dead reckoning.**
The quotas feature has two layers: (a) the `getIsQuotasEnabled()` gate in actions, and (b) runtime enforcement in `lib/response/service.ts`. If (a) returns `true` but (b) still checks a Stripe subscription's `limits` field that is `null` because no Stripe is configured, the quota system could behave unexpectedly (e.g., throwing on `null` access).

**Failure Mode 4: `UpgradePrompt` rendered with always-false isEntitled.**
Some components may compute feature entitlement client-side by passing the result of `getIs*Enabled()` as a prop to `UpgradePrompt`. If the server action still returns `true` but a client-side check (e.g., context provider) returns `false`, the user sees an upgrade prompt that links to a page that doesn't exist (Formbricks Cloud pricing) — a dead end UX.

**Failure Mode 5: The `isPendingDowngrade` flag.**
`getEnterpriseLicense()` returns `isPendingDowngrade: false` in its current default state. If any downstream code reads this flag and conditionally blocks functionality, we need to ensure that code path also returns `false` after neutering.

**Failure Mode 6: `license-check/lib/license.ts` has 726 lines of complex caching, retry, and fallback logic. Simply deleting it may reveal hidden callers from other packages.**

**Failure Mode 7: The `modules/entitlements/` package is an intermediate layer between license-check and Stripe billing. If we keep license-check but neuter it, entitlements may still try to reach Stripe for cloud deployments.**

**Failure Mode 8: Response pipeline telemetry (`modules/response-pipeline/lib/telemetry.ts`) hashes `ENTERPRISE_LICENSE_KEY` and sends it to Formbricks telemetry. If `ENTERPRISE_LICENSE_KEY` is removed, this code path becomes a no-op (which is fine), but the env access must not crash.**

### Implementor Response

**Response to FM1 (Cache keys):** We will make `ENTERPRISE_LICENSE_KEY` optional in `env.ts` and add a guard in `getCacheIdentifier()` that returns a static "agpl-fork" key when no license key is present. Simpler approach: modify `getEnterpriseLicense()` to return a hardcoded "active" result without ever calling `fetchLicense()`, so the cache key issue is moot — Redis is never touched for license data.

**Response to FM2 (Audit logs):** The `withAuditLogging` wrapper DOES call `getIsAuditLogsEnabled()` in `audit-logs/lib/handler.ts`. After neutering to return `true`, the wrapper will proceed to write audit logs via Prisma. Verify the `AuditLog` Prisma model exists and is migratable. If the model was only created via an EE migration, it must exist in the fork's schema. Check `/packages/database/schema.prisma` for `AuditLog` model.

**Response to FM3 (Quotas):** In `lib/response/service.ts`, the quota check calls `getIsQuotasEnabled(organizationId)` and if true, calls `getOrganizationBilling()` and checks `limits.responses`. For self-hosted with no Stripe, `getOrganizationBilling()` returns `null`. The existing code handles `null` by checking `if (!organizationBilling)` and presumably falling back to unlimited. We must verify this path.

**Response to FM4 (Client-side UpgradePrompt):** Most `UpgradePrompt` usage is in server-rendered pages where `getIs*Enabled()` is called on the server and the result drives conditional rendering. For the few client components, they receive the permission as a prop from a parent server component. Since we're fixing the server-side gates, all paths flow correctly. But we should grep for any client-side `getIs*Enabled` calls to confirm.

**Response to FM5 (isPendingDowngrade):** After neutering, `isPendingDowngrade` will always be `false`. Grep for usages of this field: `grep -r "isPendingDowngrade" apps/web/` — if found, ensure the consuming code doesn't take negative action on `false`. (Spoiler: it's used in billing UI for cloud, so not relevant.)

**Response to FM6 (Hidden callers):** Run `grep -r "from.*license-check" apps/web/` to get the complete list of 74 import sites. Also check `packages/` for any cross-package imports. The `@formbricks/cache` package is used by `license.ts` but doesn't import from it.

**Response to FM7 (Entitlements):** The `modules/entitlements/` package is Cloud-only. For self-hosted, `IS_FORMBRICKS_CLOUD` is `false`, so the entire entitlements path is skipped. The `license-check/lib/utils.ts` functions already have `if (IS_FORMBRICKS_CLOUD) { ... } else { ... }` branches — we only need to modify the self-hosted (`else`) branch.

**Response to FM8 (Telemetry):** The response pipeline telemetry already guards with `if (env.ENTERPRISE_LICENSE_KEY)` before hashing. Making the env var optional and removing it from deployments means this code is never reached. No change needed to telemetry itself.

---

## Phase 3: Solution Proposal

### Strategy: Neutering Over Deletion

We will **not delete** the EE source files. We will **neuter** the license-check layer so every gate returns an enabled/active result, then remove the guard clauses that check those gates. This preserves the codebase structure, minimizes diff size, and keeps future upstream merges manageable.

### Core Changes

#### A. Neutering `license-check/lib/license.ts`

The simplest and safest change is to replace `getEnterpriseLicense()` with a function that returns a synthetic active license. This avoids touching the complex caching/retry logic (which can remain but will never be called if we short-circuit at the top level).

**Approach option 1 (preferred):** Make `getEnterpriseLicense()` return a hardcoded active result immediately:
```typescript
export const getEnterpriseLicense = reactCache(async (): Promise<TEnterpriseLicenseResult> => {
  return {
    active: true,
    features: {
      isMultiOrgEnabled: true,
      workspaces: null, // unlimited
      twoFactorAuth: true,
      sso: true,
      whitelabel: true,
      removeBranding: true,
      contacts: true,
      aiSmartTools: true,
      saml: false, // not implemented
      spamProtection: true,
      auditLogs: true,
      accessControl: true,
      quotas: true,
      feedbackDirectories: true,
      dashboards: true,
    },
    lastChecked: new Date(),
    isPendingDowngrade: false,
    fallbackLevel: "live",
    status: "active",
  };
});
```

**Approach option 2 (less invasive):** Short-circuit `getEnterpriseLicense()` at its very top — immediately before the memory cache check — and return the synthetic result. This keeps the rest of the file intact for diff clarity.

#### B. Neutering `license-check/lib/utils.ts`

Replace every exported function body with `return true` (or appropriate unlimited default). For example:

```typescript
export const getRemoveBrandingPermission = async (organizationId: string): Promise<boolean> => true;
export const getWhiteLabelPermission = async (organizationId: string): Promise<boolean> => true;
export const getIsMultiOrgEnabled = async (): Promise<boolean> => true;
export const getIsContactsEnabled = async (organizationId: string): Promise<boolean> => true;
export const getIsTwoFactorAuthEnabled = async (): Promise<boolean> => true;
export const getIsSsoEnabled = async (): Promise<boolean> => true;
export const getIsQuotasEnabled = async (organizationId: string): Promise<boolean> => true;
export const getIsAISmartToolsEnabled = async (organizationId: string): Promise<boolean> => true;
export const getIsAuditLogsEnabled = async (): Promise<boolean> => true;
export const getIsSpamProtectionEnabled = async (organizationId: string): Promise<boolean> => true;
export const getAccessControlPermission = async (organizationId: string): Promise<boolean> => true;
export const getIsFeedbackDirectoriesEnabled = async (organizationId: string): Promise<boolean> => true;
export const getIsDashboardsEnabled = async (organizationId: string): Promise<boolean> => true;
export const getBulkInvitePermission = async (organizationId: string): Promise<boolean> => true;
export const getIsSamlSsoEnabled = async (): Promise<boolean> => false; // SAML not implemented; keep false
export const getBiggerUploadFileSizePermission = async (organizationId: string): Promise<boolean> => true;
export const getOrganizationWorkspacesLimit = async (organizationId: string): Promise<number> => Infinity;
```

The `getFeaturePermission`, `getCustomPlanFeaturePermission`, `getSpecificFeatureFlag` helper functions can be removed entirely (no callers after above changes) or left as dead code.

#### C. Removing `ENTERPRISE_LICENSE_KEY` from env and constants

1. **`lib/env.ts`** — Change `ENTERPRISE_LICENSE_KEY: z.string().optional()` entry — either remove it or leave it optional (prefer removing to avoid confusion).
2. **`lib/constants.ts`** — Remove `export const ENTERPRISE_LICENSE_KEY = env.ENTERPRISE_LICENSE_KEY;`
3. **`vitestSetup.ts`** — Remove the `ENTERPRISE_LICENSE_KEY` mock assignment.
4. **All test files** — Remove `ENTERPRISE_LICENSE_KEY` from test env mocks (found in ~10+ test files).

#### D. Removing Gate Clauses in Feature Code

For each feature, we will:
1. Remove the `import { getIs*Enabled } from "@/modules/ee/license-check/lib/utils"` line
2. Remove the `const isEnabled = await getIs*Enabled(id)` call
3. Remove the `if (!isEnabled) { throw / return / show UpgradePrompt }` block

For the `UpgradePrompt` component imports: remove the import line AND the `<UpgradePrompt>` JSX usage. The `UpgradePrompt` component file itself is kept.

#### E. Spam Protection Specifics

`getIsSpamProtectionEnabled` also checks `IS_RECAPTCHA_CONFIGURED`. After neutering, it will return `true` regardless of ReCaptcha config. However, the actual ReCaptcha verification in API routes checks the env vars at the point of use (e.g., `verifyReCaptcha()` calls `env.RECAPTCHA_SECRET_KEY`). If these are unset, ReCaptcha will fail at verification time, which is acceptable. The gate should still return `true` to avoid blocking survey creation.

---

## Phase 4: Per-Feature Breakdown

### Feature 0: license-check module itself (FOUNDATION — do first)

| File | Change |
|------|--------|
| `apps/web/modules/ee/license-check/lib/license.ts` | Replace `getEnterpriseLicense()` body with synthetic active result. Keep other exports for type compatibility but they will never be called. |
| `apps/web/modules/ee/license-check/lib/utils.ts` | Replace all exported functions with `return true` stubs. Remove helper functions (`getFeaturePermission`, `getCustomPlanFeaturePermission`, `getSpecificFeatureFlag`). |
| `apps/web/modules/ee/license-check/types/enterprise-license.ts` | Keep as-is (types used by synthetic result). |
| `apps/web/modules/ee/license-check/actions.ts` | Review — may export recheck-license actions that should be no-op'd. |

### Feature 1: Remove Branding

| File | Change |
|------|--------|
| `apps/web/modules/ee/whitelabel/remove-branding/actions.ts` | Remove gate/import — `getRemoveBrandingPermission` |
| `apps/web/modules/ee/whitelabel/remove-branding/components/branding-settings-card.tsx` | Remove `UpgradePrompt` usage |
| `apps/web/modules/ee/whitelabel/remove-branding/components/edit-branding.tsx` | Remove gate/import |
| `apps/web/modules/workspaces/settings/look/page.tsx` | Remove gate/import — `getRemoveBrandingPermission` |
| `apps/web/modules/workspaces/settings/actions.ts` | Remove gate/import — `getRemoveBrandingPermission` |
| `apps/web/modules/workspaces/components/workspace-limit-modal/index.tsx` | Remove `UpgradePrompt` usage |

### Feature 2: White-label Customizations (Email + Favicon)

| File | Change |
|------|--------|
| `apps/web/modules/ee/whitelabel/email-customization/actions.ts` | Remove gate/import — `getWhiteLabelPermission` |
| `apps/web/modules/ee/whitelabel/email-customization/components/email-customization-settings.tsx` | Remove `UpgradePrompt` usage |
| `apps/web/modules/ee/whitelabel/favicon-customization/actions.ts` | Remove gate/import — `getWhiteLabelPermission` |
| `apps/web/modules/ee/whitelabel/favicon-customization/components/favicon-customization-settings.tsx` | Remove `UpgradePrompt` usage |
| `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/domain/page.tsx` | Remove gate/import — `getWhiteLabelPermission` |

### Feature 3: Role Management (Access Control)

| File | Change |
|------|--------|
| `apps/web/modules/ee/role-management/actions.ts` | Remove gate — `getAccessControlPermission` call in `checkRoleManagementPermission()`; make function a no-op or remove it and its callers |
| `apps/web/modules/ee/teams/team-list/components/teams-view.tsx` | Remove `UpgradePrompt` usage |
| `apps/web/modules/organization/settings/teams/actions.ts` | Remove gates — `getBulkInvitePermission`, `getIsMultiOrgEnabled` |
| `apps/web/modules/organization/settings/teams/page.tsx` | Remove gate — `getAccessControlPermission` |
| `apps/web/modules/organization/settings/teams/components/members-view.tsx` | Remove gates — `getBulkInvitePermission`, `getIsMultiOrgEnabled` |
| `apps/web/app/(app)/workspaces/[workspaceId]/actions.ts` | Remove gate — `getAccessControlPermission` |
| `apps/web/modules/workspaces/lib/utils.ts` | Remove gate — `getAccessControlPermission` |

### Feature 4: Teams Management

| File | Change |
|------|--------|
| `apps/web/modules/ee/teams/team-list/components/teams-view.tsx` | Remove gate/`UpgradePrompt` |
| Other teams files under `modules/ee/teams/` | Check for license-check imports |

### Feature 5: Contacts + Segments

| File | Change |
|------|--------|
| `apps/web/modules/ee/contacts/page.tsx` | Remove gates — `getIsContactsEnabled`, `getIsQuotasEnabled` |
| `apps/web/modules/ee/contacts/layout.tsx` | Remove gate — `getIsContactsEnabled` |
| `apps/web/modules/ee/contacts/actions.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/modules/ee/contacts/attributes/page.tsx` | Remove gate — `getIsContactsEnabled` |
| `apps/web/modules/ee/contacts/[contactId]/page.tsx` | Remove gate — `getIsQuotasEnabled` |
| `apps/web/modules/ee/contacts/components/contacts-page-layout.tsx` | Remove `UpgradePrompt` usage and related props |
| `apps/web/modules/ee/contacts/segments/page.tsx` | Remove gate — `getIsContactsEnabled`; remove `UpgradePrompt` usage |
| `apps/web/modules/ee/contacts/segments/actions.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/modules/ee/contacts/api/v1/management/contacts/route.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/modules/ee/contacts/api/v1/management/contacts/[contactId]/route.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/modules/ee/contacts/api/v1/management/contact-attribute-keys/route.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/modules/ee/contacts/api/v1/management/contact-attributes/route.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/modules/ee/contacts/api/v1/client/[workspaceId]/user/route.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/modules/ee/contacts/api/v2/management/contacts/route.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/modules/ee/contacts/api/v2/management/contacts/bulk/route.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/app/api/v1/client/[workspaceId]/displays/route.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/app/api/v1/client/[workspaceId]/responses/route.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/app/api/v2/client/[workspaceId]/displays/route.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/app/api/v2/client/[workspaceId]/responses/route.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/modules/survey/link/components/survey-renderer.tsx` | Remove gate — `getIsContactsEnabled` |
| `apps/web/app/(app)/workspaces/[workspaceId]/surveys/[surveyId]/(analysis)/summary/page.tsx` | Remove gates — `getIsContactsEnabled`, `getIsQuotasEnabled` |
| `apps/web/app/(app)/workspaces/[workspaceId]/surveys/[surveyId]/(analysis)/summary/actions.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/app/(app)/workspaces/[workspaceId]/surveys/[surveyId]/(analysis)/responses/page.tsx` | Remove gates — `getIsContactsEnabled`, `getIsQuotasEnabled` |
| `apps/web/modules/api/v2/management/surveys/[surveyId]/contact-links/contacts/[contactId]/route.ts` | Remove gate — `getIsContactsEnabled` |
| `apps/web/modules/api/v2/management/surveys/[surveyId]/contact-links/segments/[segmentId]/route.ts` | Remove gate — `getIsContactsEnabled` |

### Feature 6: Quota Management

| File | Change |
|------|--------|
| `apps/web/modules/ee/quotas/actions.ts` | Remove gate — `getIsQuotasEnabled` in `checkQuotasEnabled()` |
| `apps/web/modules/ee/quotas/components/quotas-card.tsx` | Remove `UpgradePrompt` usage |
| `apps/web/lib/response/service.ts` | Remove gate — `getIsQuotasEnabled` |
| `apps/web/modules/survey/list/lib/survey.ts` | Remove gate — `getIsQuotasEnabled` |
| `apps/web/app/(app)/workspaces/[workspaceId]/surveys/[surveyId]/actions.ts` | Remove gate — `getIsQuotasEnabled` |

### Feature 7: Unified Feedback / Feedback Inbox

| File | Change |
|------|--------|
| `apps/web/modules/ee/unify-feedback/page.tsx` | Remove gate — `getIsFeedbackDirectoriesEnabled`; remove `UpgradePrompt` |
| `apps/web/modules/ee/unify-feedback/actions.ts` | Remove gate — `getIsFeedbackDirectoriesEnabled` |
| `apps/web/modules/ee/unify-feedback/sources/page.tsx` | Remove gate — `getIsFeedbackDirectoriesEnabled`; remove `UpgradePrompt` |
| `apps/web/modules/ee/unify-feedback/sources/actions.ts` | Remove gate — `getIsFeedbackDirectoriesEnabled` |
| `apps/web/modules/ee/unify-feedback/topics-subtopics/page.tsx` | Remove gate — `getIsFeedbackDirectoriesEnabled`; remove `UpgradePrompt` |
| `apps/web/modules/ee/unify-feedback/topics-subtopics/actions.ts` | Remove gate — `getIsFeedbackDirectoriesEnabled` |

### Feature 8: Feedback Directories

| File | Change |
|------|--------|
| `apps/web/modules/ee/feedback-directory/page.tsx` | Remove gate — `getIsFeedbackDirectoriesEnabled`; remove `UpgradePrompt` |
| `apps/web/modules/ee/feedback-directory/actions.ts` | Remove gate — `getIsFeedbackDirectoriesEnabled` |
| `apps/web/modules/hub/feedback-records-gateway.ts` | Remove gate — `getIsFeedbackDirectoriesEnabled` |

### Feature 9: Insights Dashboards

| File | Change |
|------|--------|
| `apps/web/modules/ee/analysis/dashboards/actions.ts` | Remove gate — `getIsDashboardsEnabled` |
| `apps/web/modules/ee/analysis/dashboards/pages/dashboards-list-page.tsx` | Remove gate — `getIsDashboardsEnabled`; remove `UpgradePrompt` |
| `apps/web/modules/ee/analysis/dashboards/pages/dashboard-detail-page.tsx` | Remove gate — `getIsDashboardsEnabled`; remove `UpgradePrompt` |
| `apps/web/modules/ee/analysis/charts/actions.ts` | Remove gate — `getIsDashboardsEnabled` |
| `apps/web/modules/ee/analysis/charts/components/charts-list-page.tsx` | Remove gate — `getIsDashboardsEnabled`; remove `UpgradePrompt` |

### Feature 10: Audit Logs

| File | Change |
|------|--------|
| `apps/web/modules/ee/audit-logs/lib/handler.ts` | Remove gate — `getIsAuditLogsEnabled` |

### Feature 11: AI Translation

| File | Change |
|------|--------|
| `apps/web/modules/ee/ai-translation/lib/actions.ts` | (Check for license-check import) |
| `apps/web/lib/ai/service.ts` | Remove gate — `getIsAISmartToolsEnabled` |

### Feature 12: Spam Protection (ReCaptchaV3)

| File | Change |
|------|--------|
| `apps/web/modules/survey/lib/permission.ts` | Remove gate — `getIsSpamProtectionEnabled` |
| `apps/web/app/api/v1/management/surveys/lib/utils.ts` | Remove gate — `getIsSpamProtectionEnabled` |
| `apps/web/app/api/v2/client/[workspaceId]/responses/lib/utils.ts` | Remove gate — `getIsSpamProtectionEnabled` |

Note: The `IS_RECAPTCHA_CONFIGURED` constant in `lib/constants.ts` is NOT an EE-license concern — it's an env-var check. Keep it as-is.

### Feature 13: Two-Factor Authentication

| File | Change |
|------|--------|
| `apps/web/modules/ee/two-factor-auth/actions.ts` | Remove gate — `getIsTwoFactorAuthEnabled` |
| `apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/page.tsx` | Remove gate — `getIsTwoFactorAuthEnabled`; remove `UpgradePrompt` |

### Feature 14: Multi-Org / Custom Workspace Count

| File | Change |
|------|--------|
| `apps/web/app/setup/organization/create/actions.ts` | Remove gate — `getIsMultiOrgEnabled` |
| `apps/web/modules/setup/organization/create/page.tsx` | Remove gate — `getIsMultiOrgEnabled` |
| `apps/web/app/(app)/(onboarding)/organizations/[organizationId]/landing/page.tsx` | Remove gate — `getIsMultiOrgEnabled` |
| `apps/web/app/(app)/(onboarding)/lib/onboarding-workspace.ts` | Remove gate — `getIsAISmartToolsEnabled` |
| `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/general/actions.ts` | Remove gate — `getIsMultiOrgEnabled` |
| `apps/web/modules/organization/actions.ts` | Remove gate — `getIsMultiOrgEnabled` |
| `apps/web/modules/organization/settings/teams/components/members-view.tsx` | Remove gate — `getIsMultiOrgEnabled` |
| `apps/web/modules/organization/settings/teams/actions.ts` | Remove gate — `getIsMultiOrgEnabled` |
| `apps/web/modules/account/lib/account-deletion.ts` | Remove gate — `getIsMultiOrgEnabled` |
| `apps/web/modules/auth/signup/actions.ts` | Remove gate — `getIsMultiOrgEnabled` |
| `apps/web/modules/auth/layout.tsx` | Remove gate — `getIsMultiOrgEnabled` |
| `apps/web/app/(app)/workspaces/[workspaceId]/components/WorkspaceLayout.tsx` | Remove gate — `getOrganizationWorkspacesLimit` |

### Feature 15: Custom Onboarding

| File | Change |
|------|--------|
| `apps/web/app/(app)/(onboarding)/lib/onboarding-workspace.ts` | Remove gate — `getIsAISmartToolsEnabled` |

### Env + Constants + Test Cleanup

| File | Change |
|------|--------|
| `apps/web/lib/env.ts` | Remove `ENTERPRISE_LICENSE_KEY` from env schema |
| `apps/web/lib/constants.ts` | Remove `ENTERPRISE_LICENSE_KEY` export |
| `apps/web/vitestSetup.ts` | Remove `ENTERPRISE_LICENSE_KEY` mock |
| `apps/web/modules/ee/license-check/lib/license.test.ts` | Remove or neuter — tests for phone-home are obsolete |
| `apps/web/modules/response-pipeline/lib/telemetry.ts` | Remove `ENTERPRISE_LICENSE_KEY` hash (or leave as no-op with optional chaining) |
| `apps/web/modules/auth/lib/authOptions.test.ts` | Remove `ENTERPRISE_LICENSE_KEY` from env mocks |
| `apps/web/app/api/v1/management/responses/lib/response.test.ts` | Remove `ENTERPRISE_LICENSE_KEY` mock |
| `apps/web/app/api/v1/client/[workspaceId]/environment/lib/environmentState.test.ts` | Remove `ENTERPRISE_LICENSE_KEY` mock |
| `apps/web/app/api/v2/client/[workspaceId]/responses/lib/response.test.ts` | Remove `ENTERPRISE_LICENSE_KEY` mock |

---

## Phase 5: Order of Execution

The work is organized into batches. Each batch can be implemented, built, and tested independently.

### Batch 0: Foundation (license-check module)
**Files:** `license-check/lib/license.ts`, `license-check/lib/utils.ts`, `license-check/types/`
**Why first:** Every other feature depends on these functions. Once neutered, all downstream gates become no-ops.
**Verify:** `pnpm build` passes; no changes to feature behavior yet since gates still check — they just pass.

### Batch 1: Env + Constants + Test Setup
**Files:** `lib/env.ts`, `lib/constants.ts`, `vitestSetup.ts`, all test files with ENTERPRISE_LICENSE_KEY
**Why second:** Removes the env var that `license-check` no longer needs. Tests failing is expected until we update test mocks.
**Verify:** `pnpm build` passes but `pnpm test` may have failures (tests still mock `getIs*Enabled` returning `false`).

### Batch 2: Contacts + Segments (heaviest gating, ~28 files)
**Why third:** Most import sites, most API routes, most complex gating. Getting this done early validates the approach at scale.

### Batch 3: Quota Management (~5 files)
**Why:** Quotas have runtime enforcement in `lib/response/service.ts` — important to verify the enforcement path.

### Batch 4: Remove Branding + White-label (~6 files)
**Why:** Straightforward, mostly UI-level gating.

### Batch 5: Role Management + Teams (~6 files)
**Why:** Directly affects user permissions — important to get right.

### Batch 6: Unify Feedback + Feedback Directories (~8 files)
**Why:** Shared code paths; do together.

### Batch 7: Dashboards / Analysis / Charts (~5 files)
**Why:** Heaviest UI with multiple nested components.

### Batch 8: Audit Logs (~1 file)
**Why:** The `withAuditLogging` wrapper is used across the app — must ensure audit logging still works.

### Batch 9: Two-Factor Auth (~2 files)
**Why:** Security feature — verify the TOTP flow still works.

### Batch 10: AI Translation + Spam Protection (~5 files)
**Why:** AI and spam features have external service dependencies — gates are the least of the concerns.

### Batch 11: Multi-Org / Workspace Limits (~10 files)
**Why:** Broadly scattered across auth flow, setup, and settings pages.

### Batch 12: Final Test Fixes and Verification
**Why:** Update all test mocks from `mockResolvedValue(false)` to `mockResolvedValue(true)` or remove mocks entirely.

---

## Phase 6: Verification Plan

### Per-Batch Verification

After each batch:

1. **Build check**: `pnpm build` (or `pnpm build --filter=@formbricks/web` if turbo is slow)
2. **Lint check**: `pnpm lint` 
3. **Test check**: `pnpm test` — expected failures are OK if they're from other batches' unmocked gates
4. **Manual check**: Start dev server (`pnpm dev`) and verify the feature's main page renders without upgrade prompt

### Full Project Verification (after all batches)

1. **`pnpm build`** — must pass with zero errors
2. **`pnpm lint`** — must pass with zero errors (or pre-existing only)
3. **`pnpm test`** — must pass. All test files that mock `license-check/lib/utils` must be updated to mock `true` or remove the mock entirely
4. **`pnpm test:coverage`** — run to confirm no regression
5. **`pnpm test:e2e`** — run Playwright E2E tests to verify critical flows (survey creation, response collection, login)

### Feature-Specific Verification

| Feature | Verification |
|---------|-------------|
| Remove Branding | Navigate to workspace settings → look → verify "Powered by Formbricks" toggle is accessible without upgrade prompt |
| White-label | Navigate to organization settings → domain → verify email/favicon customization is accessible |
| Role Management | Navigate to team settings → verify role dropdown options are not restricted |
| Contacts | Navigate to contacts page → verify contacts list renders, segments page accessible |
| Quotas | Create a survey → verify quota settings UI is accessible in survey editor |
| Feedback Inbox | Navigate to feedback → verify unified inbox renders |
| Feedback Directories | Navigate to feedback directories → verify directory list renders |
| Dashboards | Navigate to analysis → dashboards → verify dashboard create/view works |
| Audit Logs | Perform an action (e.g., update survey) → verify audit log entry is created |
| AI Translation | Create/edit survey → verify AI translate button is accessible |
| Spam Protection | Create survey with ReCaptcha configured → verify spam protection toggle |
| 2FA | Navigate to account settings → profile → verify 2FA setup UI is accessible |
| Multi-Org | Start signup flow → verify organization creation is not limited |
| Custom Onboarding | Navigate onboarding → verify AI smart tools step is accessible |

### Known Unchanged Failures

The following are expected to remain unchanged and should NOT be considered verification failures:
- SAML SSO (not implemented) — `getIsSamlSsoEnabled` returns `false`
- Cloud-only billing pages (`/billing`) — will show empty/broken state without Stripe keys
- ReCaptcha verification at form submission time (requires `RECAPTCHA_SECRET_KEY` env var)
- AI translation API calls (requires `OPENAI_API_KEY` env var)
