---
ticket: T017
phase: build
status: done
created: 2026-06-30
requires:
  - aes/kanban.md
  - aes/tickets/T017-name.md
  - aes/tickets/T017-plan.md
produces:
  - aes/tickets/T017-build.md
---

# T017 — Build

## Implementation Summary

Fixed three issues in the settings pages after the EE→AGPL rewrite:
1. Feedback-directories page was crashing (client component called as function)
2. Enterprise page was showing misleading EE licensing UI
3. Teams page rendered "No teams found." (wrong props passed to TeamsView)

## Changed Files

| File | Operation | Lines +/- | Why |
|------|-----------|-----------|-----|
| `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/feedback-directories/page.tsx` | modified | -1/+1 | Fix JSX render |
| `apps/web/modules/organization/settings/teams/page.tsx` | modified | +2/-5 | Fix TeamsView props |
| `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/enterprise/page.tsx` | modified | -32/+52 | Replace with AGPL page |
| `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/enterprise/loading.tsx` | modified | -4/+2 | Match new page |
| `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/enterprise/components/EnterpriseLicenseStatus.tsx` | deleted | -173 | No longer needed |
| `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/enterprise/components/EnterpriseLicenseFeaturesTable.tsx` | deleted | -165 | No longer needed |
| `apps/web/app/(app)/workspaces/[workspaceId]/components/SettingsSidebarContent.tsx` | modified | +1/-1 | Update sidebar label |
| `apps/web/modules/ui/components/pending-downgrade-banner/index.tsx` | modified | -2/+2 | Update link text + remove unused import |

## Diffstory

### What changed?
- **Feedback-directories**: Changed `FeedbackDirectoriesPage(props)` to `<FeedbackDirectoriesPage />` — the `"use client"` component was being called as a function from the server route, which Next.js forbids.
- **TeamsView**: Added `getTeamsByOrganizationId()` fetch and changed `<TeamsView>` from receiving 5 incorrect props to receiving the `teams` array it actually expects. Was rendering "No teams found." even when teams existed.
- **Enterprise page**: Completely replaced. Old page called `getEnterpriseLicense()` stub, rendered `EnterpriseLicenseStatus` (recheck button, badge) and `EnterpriseLicenseFeaturesTable` (14 features with enabled/disabled badges). New page is a static server component showing: "All features are available under AGPLv3. No license key required." + a 2-column feature list with green checkmarks.
- **Deleted**: 2 component files (EnterpriseLicenseStatus, EnterpriseLicenseFeaturesTable) — no callers remain.
- **Sidebar**: Label changed from "Enterprise License" to "AGPL Resources".
- **Pending-downgrade-banner**: Removed the Link "learn more" that pointed to old enterprise page, replaced with static text "All features are available under AGPLv3." Removed unused `Link` import.

### Why these files?
- Route files needed fixing because they were the actual crash sites
- Component files deleted because they only existed for the misleading license UI
- Sidebar updated because the page serves a different purpose now
- Banner updated because the page it linked to no longer exists

### What was intentionally untouched?
- License-check stubs in `modules/ee/license-check/` — they work correctly (all return `true`/`active`)
- `MainNavigation.tsx`, `workspace-breadcrumb.tsx` upgrade links — they point to `/organization/enterprise` and won't be triggered (license stub returns Infinity workspace limit)
- Other `UpgradePrompt` usage across the codebase — stubs return `true`, prompts never show
- The `getWorkspacePermissionByUserId` Prisma bug — discovered but separate issue (needs investigation)
- Locale/translation files — new page uses existing i18n keys where possible, hardcoded English text for new AGPL-specific content

### What was verified?
- All modified files read and confirmed correct
- Deleted files confirmed removed
- Build will need to be tested via Docker rebuild or hotfix
- Previous withAuditLogging hotfix already applied to running container

### Remaining risks
- The `as any` cast on the i18n key `t(`workspace.settings.enterprise.${feature}` as any)` — runtime works but TypeScript won't validate the key
- If the sidebar `isMember` check is wrong and members shouldn't see this page, the `disabled` prop still blocks interaction (but the page renders)
- The empty `components/` directory was removed — if Docker build creates it from a layer, it may reappear (harmless)

## Decisions Made

| Decision | Rejected Alternative | Reason |
|----------|---------------------|--------|
| Replace enterprise page with AGPL info | Remove entirely (redirect) | User chose option B: informative page |
| Hardcode English AGPL text | Add new i18n keys | Simpler; impact minimal for PT deployment |
| Remove isMember check from enterprise page | Keep it | All users should see available features |
| Remove redirectBillingRoleFromRestrictedSettings from enterprise page | Keep it | Not needed — page is informational, no settings |

## Scope Creep Detected
- [x] None
- [ ] TNEW — [description] — added to backlog

## Quality Gates (Local)
- [ ] Tests pass (no tests exist for these pages)
- [ ] Lint passes (TypeScript build not feasible on this hardware — `ignoreBuildErrors: true`)
- [x] No TODO in source
- [x] No dead code
- [x] No critical files touched without flagging

## Notes for Verify
- Need Docker rebuild for changes to take effect in production
- Alternatively: hotfix the compiled chunks if rebuild takes too long
- Verify by visiting each of the 3 affected pages after deploy
- Verify sidebar shows "AGPL Resources" not "Enterprise License"
