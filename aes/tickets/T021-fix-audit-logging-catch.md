---
ticket: T021
title: Fix withAuditLogging .catch error in chunk _0a_0a3e._.js
sprint: sprint-02
priority: high
status: backlog
created: 2026-07-01
---

# T021 — Fix withAuditLogging .catch error in chunk

## Context
During T017 verification, docker logs revealed `withAuditLogging` throwing `.catch` errors in compiled chunk `_0a_0a3e._.js`. The T017 hot-patch only fixed one of two affected chunks. The second chunk still has the broken error handling.

## Acceptance Criteria
- [ ] `withAuditLogging` works correctly in all compiled chunks
- [ ] No `.catch` errors in docker logs after deployment
- [ ] Audit logging continues to function for all API routes

## Scope
**In scope:** Hot-patch or source fix for the affected chunk
**Out of scope:** Refactoring the audit logging architecture

## Dependencies
T022 (build infrastructure) would make this easier — currently requires hot-patching.

## Rollback
Restore the original chunk from the Docker image.

## Known Risks
- Hot-patching is fragile — chunk hashes change on rebuild
- The root cause may be in the `withAuditLogging` HOC itself

## Notes
- Source: T017 verify phase log analysis
- The `withAuditLogging` function wraps API route handlers and queues audit events
