---
ticket: T029
title: Delete orphan modules/ directory at fork root
sprint: sprint-02
priority: blocker
status: pending
created: 2026-09-11
---

# T029 — Delete orphan modules/ directory at fork root

## Context
`/opt/forms/formbricks/modules/ee/` contains 34 untracked files across 7 feature dirs (ai-translation, analysis, billing, feedback-directory, mailing, unify-feedback, whitelabel). These are older/in-progress variants of the rewrite — NOT the canonical code (which lives in `apps/web/modules/ee/`). Because `.dockerignore` does not exclude it and `Dockerfile:53` runs `COPY . .`, this junk ships into the production Docker image.

Some files (e.g., `modules/ee/analysis/charts/actions.ts`) may contain EE-derived code — retaining them is a legal risk.

## Acceptance Criteria
- [ ] `modules/` directory at fork root is completely deleted
- [ ] `.gitignore` includes `modules/` to prevent re-creation
- [ ] Docker build no longer includes the orphan directory
- [ ] No imports reference `modules/` (should already be true — tsconfig maps `@/*` to `apps/web/*`)

## Scope
**In scope:** `modules/` directory, `.gitignore`, Dockerfile
**Out of scope:** `apps/web/modules/ee/` (that's the canonical code)

## Dependencies
None — cleanup.

## Rollback
Restore from untracked state. But the files are untracked, so there's nothing to restore from git.

## Known Risks
- If any of these files contain unique logic not in `apps/web/modules/ee/`, it's lost. But they're duplicates/variants, not primary.
- The `modules/ee/analysis/charts/actions.ts` reads `prisma.chart` — this might be an EE-derived pattern that was never cleaned up.

## Notes
- The `modules/` directory is also a pnpm workspace member (via `packages/*` glob in `pnpm-workspace.yaml`) — deleting it may affect workspace resolution. Need to check.
