---
ticket: T033
title: Clean up dead UpgradePrompt and enterpriseLicenseRequestFormUrl
sprint: sprint-02
priority: major
status: pending
created: 2026-09-11
---

# T033 — Clean up dead UpgradePrompt and enterpriseLicenseRequestFormUrl

## Context
6 UpgradePrompt components and 19+ components carry a dead `enterpriseLicenseRequestFormUrl` prop that is always `""`. While they don't render currently (stubs return true/Infinity), they represent dead code paths that would show "request trial license" messaging on any gate regression.

## Acceptance Criteria
- [ ] 6 UpgradePrompt components removed or neutered: `follow-ups-view.tsx`, `targeting-locked-card.tsx`, `bulk-invite-tab.tsx`, `workspace-limit-modal/index.tsx`, `AISettingsToggle.tsx`, `personal-links-tab.tsx`
- [ ] `enterpriseLicenseRequestFormUrl` prop removed from 19+ components
- [ ] `ENTERPRISE_LICENSE_REQUEST_FORM_URL` constant removed from `apps/web/lib/constants.ts`
- [ ] `PendingDowngradeBanner` component removed and unwired from `WorkspaceLayout.tsx`
- [ ] No component imports UpgradePrompt or references enterprise license forms

## Scope
**In scope:** UpgradePrompt components, enterpriseLicenseRequestFormUrl prop, PendingDowngradeBanner
**Out of scope:** The license-check stub module itself (that stays as-is)

## Dependencies
None.

## Rollback
Restore from git HEAD.

## Known Risks
- Removing UpgradePrompt may break component prop types if parent components pass props
- Need to verify no dynamic imports or conditional renders depend on these
- The `PendingDowngradeBanner` is imported in `WorkspaceLayout.tsx:10` — removal requires updating that import

## Notes
- These components are harmless while stubs return true, but they're dead code that confuses contributors
