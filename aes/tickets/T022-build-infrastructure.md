---
ticket: T022
title: Build infrastructure — cross-compile pipeline for 3.8 GB server
sprint: sprint-02
priority: high
status: backlog
created: 2026-07-01
---

# T022 — Build infrastructure: cross-compile pipeline

## Context
The production server has 3.8 GB RAM / 2 CPUs. Running `pnpm build` causes OOM (TypeScript heap exhaustion). Currently, `typescript.ignoreBuildErrors: true` is set in `next.config.mjs` as a workaround, and production deploys use hot-patching of compiled chunks.

## Acceptance Criteria
- [ ] A viable build pipeline exists that doesn't OOM on 3.8 GB RAM
- [ ] Options: (a) cross-compile on a more powerful machine, (b) use Docker build with increased memory limits, (c) use Turbopack's incremental build
- [ ] Build produces a deployable Docker image
- [ ] The image can be loaded onto the production server

## Scope
**In scope:** Build pipeline, Dockerfile, Makefile targets
**Out of scope:** Server hardware upgrades

## Dependencies
None — infrastructure foundation.

## Rollback
N/A — this is new infrastructure.

## Known Risks
- Cross-compilation requires a second machine or CI service
- Docker build with `--memory` limit may still OOM
- Turbopack incremental build may not be stable

## Notes
- The Dockerfile already exists at `apps/web/Dockerfile`
- The Makefile has `build-docker` and `image-build` targets
- Consider using GitHub Actions for CI/CD builds
