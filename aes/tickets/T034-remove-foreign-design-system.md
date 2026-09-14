---
ticket: T034
title: Remove packages/design-system/ (foreign untracked package)
sprint: sprint-02
priority: major
status: pending
created: 2026-09-11
---

# T034 — Remove packages/design-system/ (foreign untracked package)

## Context
`packages/design-system/` contains `@ilabuporto/design-system` — a completely foreign package ("Design system for U.Porto digital services"). It has 0 tracked files, no importers anywhere in the repo (`grep ilabuporto` → only itself), but becomes a pnpm workspace package via the `packages/*` glob and ships into Docker via `COPY . .`.

## Acceptance Criteria
- [ ] `packages/design-system/` directory is completely deleted
- [ ] `.gitignore` includes `packages/design-system/` to prevent re-creation
- [ ] `pnpm-workspace.yaml` does not include it (verify glob doesn't match)
- [ ] Docker build no longer includes the foreign package
- [ ] No imports reference `@ilabuporto/design-system`

## Scope
**In scope:** `packages/design-system/` directory, `.gitignore`
**Out of scope:** The Formbricks design system at `packages/ui/` (that's legitimate)

## Dependencies
None — cleanup.

## Rollback
Restore from untracked state.

## Known Risks
- If `pnpm-workspace.yaml` uses `packages/*`, deleting this dir changes workspace resolution
- Need to verify pnpm-lock.yaml doesn't reference it

## Notes
- This appears to be a development artifact that was accidentally placed in the fork
