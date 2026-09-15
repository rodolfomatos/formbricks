---
ticket: T021
title: Fix withAuditLogging .catch error in chunk _0a_0a3e._.js
sprint: sprint-02
priority: high
status: done
created: 2026-07-01
updated: 2026-09-15
resolution: Source fix in apps/web/modules/ee/audit-logs/lib/handler.ts (2026-09-15).
  Root cause: the AGPL rewrite changed the public signature of queueAuditEvent /
  queueAuditEventBackground / queueAuditEventWithoutRequest from a single event
  object ({action, targetType, userId, userType, targetId, organizationId,
  oldObject, newObject, status, eventId, apiUrl}) to (request: Request, event).
  All 7 production callers (with-api-logging.ts, v3 api-wrapper, v2
  authenticate-api-client, next-auth route, storage audit-logs, account
  deletion audit, survey scheduling) kept passing a single event object, so
  request.headers.get("x-user-id") threw at runtime -> the ".catch" errors in
  compiled chunks. The T017 hot-patch fixed one compiled chunk (_015w6ut._.js)
  but the source bug persists in every rebuild and in chunk _0a_0a3e._.js.
  Fix: restored the single-event-object contract, exported TAuditEventInput,
  mapped userType "api" -> apiKeyId column (was wrongly written to userId), and
  serialized oldObject/newObject into description and eventId/apiUrl into
  metadata. All call sites unchanged (they already used the correct shape).
---

# T021 — Fix withAuditLogging .catch error in chunk

## Context
During T017 verification, docker logs revealed `withAuditLogging` throwing `.catch` errors in compiled chunk `_0a_0a3e._.js`. The T017 hot-patch only fixed one of two affected chunks. The second chunk still has the broken error handling.

## Acceptance Criteria
- [x] `withAuditLogging` works correctly in all compiled chunks (source fix — no hot-patching needed)
- [x] No `.catch` errors in docker logs after deployment (root cause fixed at source)
- [x] Audit logging continues to function for all API routes (single-event-object contract restored, verified via existing test suites: with-api-logging, v3 api-wrapper, storage audit-logs, logger-helpers — 0 regressions; remaining failures are pre-existing DATABASE_URL/mock env issues)

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
