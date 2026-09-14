---
ticket: T038
title: Remove PendingDowngradeBanner dead code
sprint: sprint-02
priority: minor
status: pending
created: 2026-09-11
---

# T038 — Remove PendingDowngradeBanner dead code

## Context
`apps/web/modules/ui/components/pending-downgrade-banner/index.tsx` is wired into `WorkspaceLayout.tsx:10` but can never fire — the license stub returns `isPendingDowngrade:false`. It also displays AGPL text at line 95 that's misleading.

## Acceptance Criteria
- [ ] `PendingDowngradeBanner` component removed
- [ ] Import removed from `WorkspaceLayout.tsx`
- [ ] No other files import this component

## Scope
**In scope:** `pending-downgrade-banner/`, `WorkspaceLayout.tsx`
**Out of scope:** Other UI components

## Dependencies
None.

## Rollback
Restore from git HEAD.

## Known Risks
- Minor — the component is harmless but dead

## Notes
- This is part of the broader cleanup of EE vestiges (related to T033)
