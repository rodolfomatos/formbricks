---
ticket: T003
title: "UpgradePrompt/PendingDowngradeBanner consumers mantêm call-sites + paywall copy no bundle"
phase: ticket
status: pending
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
