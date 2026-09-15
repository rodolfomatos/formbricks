---
ticket: T024
title: Fix Prisma getWorkspacePermissionByUserId null/undefined args
sprint: sprint-02
priority: medium
status: done
created: 2026-07-01
updated: 2026-09-15
resolution: apps/web/modules/ee/teams/lib/roles.ts — getWorkspacePermissionByUserId
  already carried a guard (`if (!userId || !workspaceId) return null;`) from the AGPL
  rewrite, replacing the old `validateInputs([ZString])` that raised zod errors on
  null/undefined. Also fixed getTeamRoleByTeamIdUserId: the rewrite had inverted its
  argument order from (teamId, userId) to (userId, teamId) while the only caller
  (action-client-middleware.ts:91) and its test kept the original order — a contract
  break invisible to tsc. Restored (teamId, userId), added matchning guard, added
  roles.test.ts (6 tests) locking both guards + arg order. middleware suite 16/16.
---

# T024 — Fix Prisma getWorkspacePermissionByUserId null args

## Context
Docker logs show Prisma errors when `getWorkspacePermissionByUserId` is called with null/undefined arguments. This is a pre-existing bug in the teams module.

## Acceptance Criteria
- [x] `getWorkspacePermissionByUserId` handles null/undefined arguments gracefully — guard `if (!userId || !workspaceId) return null;` already lands before any prisma call; proven by roles.test.ts
- [x] No Prisma errors in docker logs for this function — guard short-circuits before `prisma.teamUser.findFirst`; `getTeamRoleByTeamIdUserId` guard added too (same null-arg failure class)
- [x] Input validation added before Prisma query — explicit truthy guard in both exported caches; `getTeamRoleByTeamIdUserId` argument order restored to caller contract (teamId, userId)

## Scope
**In scope:** `apps/web/modules/ee/teams/lib/roles.ts`
**Out of scope:** Other Prisma error handling

## Dependencies
None.

## Rollback
Restore from git HEAD.

## Known Risks
- The null args may come from a caller that's passing incomplete data — need to trace the call stack
- Fixing the symptom without fixing the caller may mask other issues

## Notes
- Source: docker log analysis during T017
- The function is `getWorkspacePermissionByUserId(userId, workspaceId)` — likely one of these is null
