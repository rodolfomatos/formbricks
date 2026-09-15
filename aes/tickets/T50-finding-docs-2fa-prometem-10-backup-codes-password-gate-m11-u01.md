---
ticket: T050
title: "Docs 2FA prometem password gate + 10 backup codes; implementação: 8 codes, sem password (M-11, U-01)"
phase: ticket
status: done
sprint: backlog
priority: low
created: '2026-09-15'
requires: []
produces: []
blocked_by: ''
---

# T050 — Docs 2FA prometem password gate + 10 backup codes; implementação: 8 codes, sem password (M-11, U-01)

## Origin

Review finding from aes-peer-review (AGPL-AUDIT-T026-T039, M-11).
- **Type:** MINOR
- **Evidence:** `docs/platform/features/user-management/two-factor-auth.mdx:29-40` documenta "Confirm Password" como Step 1 e "Save the 10 backup codes"; implementação real não tem password step (fluxo é qr→verify→backup); `actions.ts:78` gera `Array.from({ length: 8 })` backup codes de 10 chars lowercase.
- **Rubric criterion:** U-01

## Closure Condition

`two-factor-auth.mdx` descreve fielmente a implementação: sem password gate, 8 backup codes, formato correcto (10-char lowercase, sem hyphens). Ou a implementação é alterada para corresponder ao doc.

## Acceptance Criteria

- [x] step "Confirm Password" removida do doc (implementação não tem password gate; fluxo é qr→verify→backup)
- [x] 10 backup codes → 8 no doc
- [x] formato descrito nos docs: 10-char lowercase (sem "xxxxx-xxxxx")
- [x] passo de disable corrigido (sem referência a password)

## Resolution (2026-09-15)

- `two-factor-auth.mdx` setup wizard: removed "Step 1: Confirm Password"; renumbered to Step 1 Scan QR, Step 2 Verify, Step 3 Save Backup Codes; "the 8 backup codes" (matches `actions.ts` `Array.from({length: 8})`).
- Login section: backup code format corrected from "xxxxx-xxxxx or just the 10-character code" → "a 10-character lowercase code" (codes are `randomUUID().replace(/-/g,"").substring(0,10)`).
- Disable section: removed the password-entering step (disable modal is confirm-only).