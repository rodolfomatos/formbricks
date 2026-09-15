---
ticket: T003
title: "UpgradePrompt/PendingDowngradeBanner consumers mantêm call-sites + paywall copy no bundle"
phase: ticket
status: done
sprint: backlog
priority: medium
created: '2026-09-14'
requires: []
produces: []
blocked_by: ''
---

# T003 — UpgradePrompt/PendingDowngradeBanner consumers mantêm call-sites + paywall copy no bundle

## Origin

Review finding from aes-peer-review.
- **Type:** MAJOR
- **Evidence:** peer-review AGPL-AUDIT-T026-T039 findings (M-3)
- **Rubric criterion:** D-03

## Closure Condition

grep -rln 'UpgradePrompt' apps/web --include='*.tsx' (fora do módulo) = 0 e grep -rn 'unlock_more_workspaces_with_a_higher_plan' apps/web --include='*.json' = 0

This ticket is **done** when the closure condition above is verifiably met.

## Acceptance Criteria

- [x] No UpgradePrompt imports outside modules/ui/components/upgrade-prompt in apps/web (grep -rln)
- [x] No unlock_more_workspaces_with_a_higher_plan keys in any locale JSON (grep -rn)
- [x] workspace-limit-modal directory deleted
- [x] targeting-locked-card.tsx deleted
- [x] organizationWorkspacesLimit prop chain removed from MainNavigation, TopControlBar, WorkspaceAndOrgSwitch, WorkspaceBreadcrumb, landing page
- [x] i18n.lock regenerated after locale cleanup
