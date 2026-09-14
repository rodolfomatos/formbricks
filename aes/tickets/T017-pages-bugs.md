---
ticket: T017
title: Fix settings pages bugs (feedback-directories crash, enterprise license UI cleanup)
sprint: sprint-01
priority: high
status: pending
created: 2026-06-30
---

# T017 — Fix settings pages bugs

## Context

Two issues found after the EE→AGPL rewrite:

1. **Feedback-directories crash**: `/workspaces/[workspaceId]/settings/organization/feedback-directories` gives "Erro ao carregar recursos". Logs show: `"Error: Attempted to call FeedbackDirectoriesPage() from the server but FeedbackDirectoriesPage is on the client"` — the route calls a client component as a function.

2. **Enterprise license page misleading**: `/workspaces/[workspaceId]/settings/organization/enterprise` still shows full EE licensing UI: "Verificar licença novamente" button, "Funcionalidades licenciadas" table with enabled/disabled badges, contact email. Since all features are AGPL and always available, this page is misleading and should be replaced/removed.

Also discovered during reconnaissance:
- `TeamsView` on the teams page receives wrong props (expected `{teams}` but passed `{organizationId, membershipRole, ...}`) — renders "No teams found." instead of actual team list.
- `getWorkspacePermissionByUserId` is called with `undefined` workspaceId in some flows, causing Prisma validation errors.

## Acceptance Criteria

- [ ] Feedback-directories page loads without error
- [ ] Enterprise license page replaced with a simple AGPL info page or redirected to settings; sidebar link removed
- [ ] EnterpriseLicenseStatus, EnterpriseLicenseFeaturesTable components removed or simplified
- [ ] "Verificar licença novamente" button and "Funcionalidades licenciadas" table no longer shown
- [ ] Teams page renders teams correctly (no "No teams found." when teams exist)

## Scope

**In scope:**
- `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/feedback-directories/page.tsx` — fix client component call
- `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/enterprise/` — replace/remove page
- Enterprise sidebar link in `SettingsSidebarContent.tsx`, `MainNavigation.tsx`, `workspace-breadcrumb.tsx`
- `TeamsView` prop fix in `modules/organization/settings/teams/page.tsx`

**Out of scope:**
- The Prisma `getWorkspacePermissionByUserId` null/undefined bug — separate issue, needs deeper investigation
- Other EE licensing references across the codebase (UpgradePrompt components, license-check stubs) — intentional, the stubs return `true`
- License-check infrastructure files under `modules/ee/license-check/` — they work correctly (stubs)

## Dependencies
- The `withAuditLogging` hotfix (already applied to running container)

## Rollback
- Revert edits to page.tsx files for feedback-directories and enterprise

## Known Risks
- Removing the enterprise page might confuse users who previously used it to check feature availability
- The sidebar link removal should be verified across all navigation components
