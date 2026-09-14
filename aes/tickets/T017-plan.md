---
ticket: T017
phase: plan
status: done
created: 2026-06-30
tier: standard
requires:
  - aes/kanban.md
  - aes/tickets/T017-name.md
produces:
  - aes/tickets/T017-plan.md
---

# T017 — Plan

## Reconnaissance Summary

Three issues found in the settings pages after the EE→AGPL rewrite:

### Issue A: Feedback-directories crash
- **Route**: `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/feedback-directories/page.tsx`
- **Module**: `apps/web/modules/ee/feedback-directory/page.tsx` — a `"use client"` component
- **Bug**: Route line 12 calls `FeedbackDirectoriesPage(props)` as a function. Client components cannot be called as functions from server components in Next.js.
- **Log evidence**: `"Error: Attempted to call FeedbackDirectoriesPage() from the server but FeedbackDirectoriesPage is on the client"`
- **Fix**: Use `<FeedbackDirectoriesPage />` JSX syntax.

### Issue B: Enterprise page shows EE licensing UI
- **Route**: `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/enterprise/page.tsx`
- **Components**: `EnterpriseLicenseStatus.tsx` (recheck button, badge), `EnterpriseLicenseFeaturesTable.tsx` (14 features with enabled/disabled badges), `loading.tsx`
- **Bug**: Page references `getEnterpriseLicense()` from license-check stubs (which return active). Shows "Verificar licença novamente" button, "Funcionalidades licenciadas" table — both misleading since all features are AGPL and always available.
- **Sidebar references**: `SettingsSidebarContent.tsx` line 364-370, `MainNavigation.tsx` line 422, `workspace-breadcrumb.tsx` line 146, `pending-downgrade-banner/index.tsx` line 95
- **Fix**: Replace page with simple AGPL info page; remove enterprise license components; update sidebar.

### Issue C: TeamsView prop mismatch (discovered)
- **Route module**: `apps/web/modules/organization/settings/teams/page.tsx` line 44-50
- **Bug**: `<TeamsView>` receives `{organizationId, membershipRole, currentUserId, ...}` but expects `{teams: TOrganizationTeam[]}`. Always renders "No teams found."
- **Fix**: Fetch teams with `getTeamsByOrganizationId()` and pass as `teams` prop.

### Infrastructure notes
- License stubs in `modules/ee/license-check/` all return `true`/`active`/`Infinity` — no actual phone-home
- `withAuditLogging` hotfix already applied to running container
- Build uses `typescript.ignoreBuildErrors: true` (OOM constraint)

## Hostile Analysis

```
ASSUMPTIONS I AM MAKING:
- [KNOWN]    Feedback-directories crash is caused by client component called as function — log evidence
- [KNOWN]    Enterprise page shows licensing UI from pre-rewrite code — file audit
- [KNOWN]    License stubs always return active — verified in utils.ts and license.ts
- [INFERRED] TeamsView prop mismatch causes "No teams found." — component signature confirms
- [INFERRED] PendingDowngradeBanner never displays (license stub returns active) — verified
- [ASSUMED]  Removing enterprise license page does not affect other functionality — no other page depends on its route being valid

WHAT WAS NOT SPECIFIED (that matters):
- Whether the enterprise page should redirect or be replaced with content
- Whether the sidebar label should change or the item be removed entirely
- Whether Portuguese translations need updating for the new enterprise page

ALTERNATIVES NOT CHOSEN:
- Option A: Full enterprise page rewrite with license management — rejected because there IS no license management in AGPL fork
- Option B: Keep page as-is but add a disclaimer — rejected because it still shows misleading "recheck" button
- Option C: Remove page entirely + redirect 301 — rejected because a simple AGPL page is more informative than a redirect

RISKS AND SIDE EFFECTS:
- Removing enterprise page: users who previously verified feature availability via that page lose that reference
- The upgrade buttons in workspace-limit-modal and breadcrumb link to `/organization/enterprise` — they won't be triggered (license stub returns Infinity workspace limit), but if triggered by a code path change, would land on the new page
- The pending-downgrade-banner "learn more" link points to enterprise page — won't render in practice, but if it did, would land on the new page

COST OF BEING WRONG: low — any of the changes can be reverted file-by-file

SCOPE BOUNDARY:
This plan covers fixing the three bugs found. It does NOT cover:
- Investigating the Prisma `getWorkspacePermissionByUserId` null/undefined bug (separate issue, needs deeper database/investigation)
- Removing UpgradePrompt components across the codebase (intentional — license stubs return true, prompts never show)
- Deleting license-check stubs (they work correctly and serve as a no-op layer)

INVITATION FOR CONTRADICTION:
Should the enterprise page be entirely removed (redirect to /general) instead of replaced with an AGPL info page?
```

## Technical Approach

### Issue A — Feedback-directories (1 line fix)
Change the route page to render the client component as JSX instead of calling it as a function.

### Issue B — Enterprise page (moderate)
Replace the enterprise page with a simple static page that states all features are available under AGPLv3. Remove `EnterpriseLicenseStatus` and `EnterpriseLicenseFeaturesTable` components. Update the sidebar label from "Licença Enterprise" to "Recursos" or similar (or remove). Update other navigation references.

### Issue C — TeamsView props (1 line fix)  
Fetch teams with `getTeamsByOrganizationId()` in the server component and pass them to `<TeamsView>` as the `teams` prop.

## Affected Files

| File | Operation | Description |
|------|-----------|-------------|
| `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/feedback-directories/page.tsx` | modify | Fix client component call: `FeedbackDirectoriesPage(props)` → `<FeedbackDirectoriesPage />` |
| `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/enterprise/page.tsx` | modify | Replace licensing page with AGPL info page; remove imports of license-check, EnterpriseLicenseStatus, EnterpriseLicenseFeaturesTable |
| `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/enterprise/components/EnterpriseLicenseStatus.tsx` | delete | No longer needed |
| `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/enterprise/components/EnterpriseLicenseFeaturesTable.tsx` | delete | No longer needed |
| `apps/web/app/(app)/workspaces/[workspaceId]/settings/organization/enterprise/loading.tsx` | modify | Update page title and skeleton to match new simple page |
| `apps/web/app/(app)/workspaces/[workspaceId]/components/SettingsSidebarContent.tsx` | modify | Change enterprise sidebar item label from "Licença Enterprise" to "Recursos" (or remove item) |
| `apps/web/modules/organization/settings/teams/page.tsx` | modify | Fix `<TeamsView>` props: fetch teams and pass as `teams` prop |
| `apps/web/modules/ui/components/pending-downgrade-banner/index.tsx` | modify | Update "learn more" link to new AGPL page path (or remove) |

## Specification

### Feedback-directories fix
```diff
-  return FeedbackDirectoriesPage(props);
+  return <FeedbackDirectoriesPage />;
```

### Enterprise page replacement
New page content (server component):
- Title: "Recursos" (or "AGPL Open Source")
- Description: "All features are available under the AGPLv3 license. No license key required."
- Simple list of available features (the same 14 features, but shown as always-available, not licensed)
- No license status badge, no recheck button, no contact email for licensing

### TeamsView fix
```diff
+ import { getTeamsByOrganizationId } from "@/modules/ee/teams/team-list/lib/team";
  // ...
+ const teams = await getTeamsByOrganizationId(organization.id);
  // ...
  <TeamsView
-   organizationId={organization.id}
-   membershipRole={currentUserMembership?.role}
-   currentUserId={session.user.id}
-   isAccessControlAllowed={isAccessControlAllowed}
-   workspaceId={params.workspaceId}
+   teams={teams ?? []}
  />
```

## Testing Strategy

- Manual: visit each affected page after fix
  - `/workspaces/{id}/settings/organization/feedback-directories` — should load without error
  - `/workspaces/{id}/settings/organization/enterprise` — should show AGPL info, no license UI
  - `/workspaces/{id}/settings/organization/teams` — should show teams list, not "No teams found."
- No existing tests cover these pages (no E2E for Portuguese PT settings pages)

## Verification Criteria
- [ ] Feedback-directories page loads without error
- [ ] Enterprise page shows AGPL info, no "Verificar licença novamente" or "Funcionalidades licenciadas"
- [ ] Teams page renders teams correctly
- [ ] Sidebar no longer shows "Licença Enterprise" (or shows updated label)
- [ ] All other settings pages still work

## Estimation
- Complexity: low (< 2h)
- Risk: low
- Blocking dependencies: no
