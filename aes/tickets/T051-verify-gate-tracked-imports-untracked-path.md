---
ticket: T051
title: "Verify gate: detect tracked-file imports referencing untracked paths (clone-break prevention)"
phase: ticket
status: done
sprint: sprint-02
priority: high
created: '2026-09-15'
requires: []
produces: []
blocked_by: ''
---

# T051 — Verify gate: detect tracked-file imports referencing untracked paths

## Origin

Retrospective learning from T049/T050 clone-break discovery.
- **Problem:** `saml-sso/lib/*` and `whitelabel/actions.ts` were never tracked (`.gitignore:73 modules/`) while their importers were — a fresh clone would not compile.
- **Root cause:** gitignore `modules/` blocks new files under `apps/web/modules/` but does not un-track already-tracked files; no gate checked for this asymmetry.

## Closure Condition

`scripts/verify-implementation.sh` runs a gate that diffs `git ls-files` against on-disk files under `apps/web/modules/ee/` and fails if any tracked file imports a path whose target is not in git.

## Acceptance Criteria

- [x] Gate logic added to `scripts/verify-implementation.sh` (GATE-UNTRACKED)
- [x] On a clean tree with all imports tracked, gate passes (exit 0)
- [x] Gate documented in the ticket (resolution below)

## Resolution (2026-09-15)

Added `GATE-UNTRACKED` section to `scripts/verify-implementation.sh`:
1. Collects all import paths from tracked `.ts`/`.tsx` files under `apps/web/` matching `@/modules/`.
2. Resolves each import to a physical file under `apps/web/modules/`.
3. Checks each target against `git ls-files`; exits 1 if any target is not tracked.
4. Uses a temp file to capture targets; cleans up on exit.

Verified: gate passes on clean tree (all 1046 modules/ files now tracked).
