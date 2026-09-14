---
ticket: T024
title: Fix Prisma getWorkspacePermissionByUserId null/undefined args
sprint: sprint-02
priority: medium
status: backlog
created: 2026-07-01
---

# T024 — Fix Prisma getWorkspacePermissionByUserId null args

## Context
Docker logs show Prisma errors when `getWorkspacePermissionByUserId` is called with null/undefined arguments. This is a pre-existing bug in the teams module.

## Acceptance Criteria
- [ ] `getWorkspacePermissionByUserId` handles null/undefined arguments gracefully
- [ ] No Prisma errors in docker logs for this function
- [ ] Input validation added before Prisma query

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
