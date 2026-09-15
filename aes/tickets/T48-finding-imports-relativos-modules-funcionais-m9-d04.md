---
ticket: T048
title: "D-04: imports relativos ../../modules/ funcionais em apps/web (M-9, D-04)"
phase: ticket
status: done
sprint: backlog
priority: low
created: '2026-09-15'
requires: []
produces: []
blocked_by: ''
---

# T048 — D-04: imports relativos ../../modules/ funcionais em apps/web (M-9, D-04)

## Origin

Review finding from aes-peer-review (AGPL-AUDIT-T026-T039, M-9).
- **Type:** MINOR
- **Evidence:** check D-04 pré-registado devolve 9 linhas, não 0. Imports funcionais relativos: `apps/web/lib/tag/service.ts:15` (`../../modules/workspaces/settings/types/tag`), `apps/web/lib/tag/service.test.ts:6`, `apps/web/lib/utils/logger-helpers.test.ts:101,139` (`../../modules/ee/audit-logs/lib/handler`). Resto são comentários/strings de teste.
- **Rubric criterion:** D-04

## Closure Condition

Imports funcionais convertidos para o alias `@/modules/...`; re-correr D-04 → matches funcionais = 0 (comentários/strings podem ficar, com o check a ignorá-los).

## Acceptance Criteria

- [x] lib/tag/service.ts importa `@/modules/workspaces/settings/types/tag`
- [x] lib/tag/service.test.ts importa `@/modules/workspaces/settings/types/tag`
- [x] logger-helpers.test.ts usa `@/modules/ee/audit-logs/lib/handler`
- [x] imports não-alias restantes são apenas comentários/strings de teste e o resolve() do vite.config.ts de scripts/ (não-import funcional de app)

## Resolution (2026-09-15)

- `apps/web/lib/tag/service.ts:15` → `@/modules/workspaces/settings/types/tag`
- `apps/web/lib/tag/service.test.ts:6` → same alias
- `apps/web/lib/utils/logger-helpers.test.ts:101,139` → `@/modules/ee/audit-logs/lib/handler`
- `apps/web/app/layout.tsx:14` → `@/modules/ui/globals.css` (CSS import)
- Re-run D-04 check: functional imports = 0. Remaining matches are test comments/describe strings and `scripts/openapi/vite.config.ts:8` `resolve(__dirname, ...)` (build-script path, cannot use `@/` alias; not a runtime app import).
- Note: `lib/utils/logger-helpers.test.ts` and `lib/tag/service.test.ts` fail in this shell due to missing `DATABASE_URL`/Prisma env (verified identical pre/post change via stash); the alias itself resolves — errors come from `@formbricks/database` prisma init, not module-not-found.