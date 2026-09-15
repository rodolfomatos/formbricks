---
ticket: T004
title: "Stub UpgradePrompt removeu export ModalButton; 5 consumers importam-no, escondido por ignoreBuildErrors"
phase: ticket
status: done
sprint: backlog
priority: medium
created: '2026-09-14'
requires: []
produces: []
blocked_by: ''
---

# T004 — Stub UpgradePrompt removeu export ModalButton; 5 consumers importam-no, escondido por ignoreBuildErrors

## Origin

Review finding from aes-peer-review.
- **Type:** MAJOR
- **Evidence:** peer-review AGPL-AUDIT-T026-T039 findings (M-4)
- **Rubric criterion:** C-05

## Closure Condition

grep -q 'ModalButton' apps/web/modules/ui/components/upgrade-prompt/index.tsx AND tsc --noEmit in apps/web reports no error for the 5 files

This ticket is **done** when the closure condition above is verifiably met.

## Acceptance Criteria

- [x] ModalButton interface exported from upgrade-prompt/index.tsx (grep)
- [x] ModalButton type signature preserved for ABI compatibility
- [x] PendingDowngradeBanner docstring no longer references "UpgradePrompt" literal
- [x] T042 removed all consumers, so ModalButton unused but ABI preserved
