---
ticket: T046
title: "telemetry.ts comentário contém https://ee.formbricks.com (M-7, C-01)"
phase: ticket
status: done
sprint: backlog
priority: low
created: '2026-09-15'
requires: []
produces: []
blocked_by: ''
---

# T046 — telemetry.ts comentário contém https://ee.formbricks.com (M-7, C-01)

## Origin

Review finding from aes-peer-review (AGPL-AUDIT-T026-T039, M-7).
- **Type:** MINOR
- **Evidence:** `apps/web/modules/response-pipeline/lib/telemetry.ts:6` — comentário contém o literal `https://ee.formbricks.com`; `grep -rn "formbricks.com" appe/web/modules/response-pipeline/lib/telemetry.ts` retorna 1 linha (o check pré-registado C-01 exige 0).
- **Rubric criterion:** C-01

## Closure Condition

`grep -rn "formbricks.com" apps/web/modules/response-pipeline/lib/telemetry.ts` exits 1 (URL removida do comentário), e T026-verify.md regista que o ref único foi removido.

## Acceptance Criteria

- [x] telemetry.ts sem substring `formbricks.com` (grep exit 1)
- [x] T026-verify.md regista a remoção do ref de comentário

## Resolution (2026-09-15)

- Rewrote the docstring in telemetry.ts:6: removed the literal `https://ee.formbricks.com` URL; now says "the upstream SaaS".
- Verified: `grep -rn "formbricks.com" apps/web/modules/response-pipeline/lib/telemetry.ts` → exit 1 (0 lines). No behavior changed (comment only).