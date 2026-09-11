# Hostile Insights Registry

Lessons learned from experience — assumptions that proved false, mechanisms that surprised us, and patterns to remember.

---

## Turbopack Runtime — Chunk Scope

### Module Registry Is Global Across Chunks
- **Task**: T017
- **Insight**: Turbopack's `a.i(moduleId)` resolves from a **global** module registry, not per-chunk. Any module loaded via `R.c()` (the chunk-loading function) before a chunk evaluates is available to that chunk, regardless of which chunk defines the module.
- **Origin**: Hot-patching feedback-directories chunk. Module 187924 (react/jsx-runtime) was defined in the app-page template chunk, not the page chunk. Yet `a.i(187924).jsx()` worked because the app-page template was loaded first.
- **Impact**: Enables cross-chunk module injection via sed. Modules do not need to be in the same physical chunk file.
- **Applied To**: All hot-patches that need `jsx()` or `jsxs()` from react.
- **Date**: 2026-07-01

### The Same Source Code Produces Multiple Chunks
- **Task**: T017
- **Insight**: Functions like `withAuditLogging` (from `modules/ee/audit-logs/`) are compiled into **multiple** chunk files because they are imported at different route boundaries. Patching one chunk does not fix all occurrences.
- **Origin**: Fixed `_015w6ut._.js` but `_0a_0a3e._.js` still had the same bug. Verified through log analysis.
- **Impact**: To fix a bug in a shared utility, ALL chunks containing that utility must be patched. A single-chunk fix is incomplete.
- **Applied To**: When hot-patching, search ALL chunks for the bug pattern before declaring done.
- **Date**: 2026-07-01

## Infrastructure

### 3.8 GB RAM Cannot Run `pnpm build`
- **Task**: T017
- **Insight**: Next.js + Turbopack monorepo compilation requires >4 GB RAM. With `typescript.ignoreBuildErrors: true` and 9 GB swap, the build still times out (>10 min) or OOMs.
- **Origin**: Attempted `docker build --no-cache` — process killed by OOM killer.
- **Impact**: Zero ability to deploy source changes in production. All fixes must be either hot-patches to compiled chunks or pre-built elsewhere.
- **Applied To**: Any source change must include a hot-patching plan.
- **Date**: 2026-07-01

### Docker Writable Layer Persists Hot-Patches Across `docker restart`
- **Task**: T017
- **Insight**: Modifications to files inside a running container (via `docker exec sed -i`) are written to the container's writable layer. `docker restart` does NOT re-pull the image — it only restarts the process. Patches survive.
- **Origin**: Tested: applied patches, ran `docker restart`, verified patches still present in files.
- **Impact**: Hot-patches are durable as long as the container is not re-created (`docker compose up --force-recreate`, `docker rm` + `docker run`).
- **Applied To**: All hot-patches in this project.
- **Date**: 2026-07-01
