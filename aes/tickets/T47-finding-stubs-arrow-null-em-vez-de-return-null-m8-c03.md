---
ticket: T047
title: "Stubs neutered usam => null em vez de return null (M-8, C-03/C-04)"
phase: ticket
status: done
sprint: backlog
priority: low
created: '2026-09-15'
requires: []
produces: []
blocked_by: ''
---

# T047 — Stubs neutered usam => null em vez de return null (M-8, C-03/C-04)

## Origin

Review finding from aes-peer-review (AGPL-AUDIT-T026-T039, M-8).
- **Type:** MINOR
- **Evidence:** `apps/web/modules/ui/components/upgrade-prompt/index.tsx:27` e `pending-downgrade-banner/index.tsx:18` usam arrow-shorthand `=> null`; o check pré-registado C-03/C-04 (`grep -rn "return null"`) retorna 0 nesses ficheiros.
- **Rubric criterion:** C-03

## Closure Condition

`grep -rn "return null" apps/web/modules/ui/components/upgrade-prompt/index.tsx apps/web/modules/ui/components/pending-downgrade-banner/index.tsx` retorna as linhas de ambos os stubs (block body `{ return null; }`).

## Acceptance Criteria

- [x] upgrade-prompt/index.tsx contém `return null;`
- [x] pending-downgrade-banner/index.tsx contém `return null;`
- [x] grep C-03/C-04 retorna ≥1 linha por ficheiro

## Resolution (2026-09-15)

- Converted both stubs from arrow-shorthand to block body:
  - `upgrade-prompt/index.tsx:37-39` — `export const UpgradePrompt = (_props: UpgradePromptProps) => { return null; };`
  - `pending-downgrade-banner/index.tsx:18-20` — `export const PendingDowngradeBanner = (_props: PendingDowngradeBannerProps) => { return null; };`
- Verified: `grep -rn "return null"` returns both files (lines 38, 19). Behavior unchanged (same null render).