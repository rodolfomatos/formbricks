---
ticket: T036
title: Add unit tests for rewritten EE modules
sprint: sprint-03
priority: major
status: pending
created: 2026-09-11
---

# T036 — Add unit tests for rewritten EE modules

## Context
All 15 rewritten EE features (88 files) ship with zero unit tests. This violates AGENTS.md testing guidelines and means regressions are undetectable without manual testing. The most critical modules to test are:
1. `license-check/lib/utils.ts` — 17 gate functions (trivial but critical)
2. `audit-logs/lib/handler.ts` — core audit logging
3. `contacts/lib/contacts.ts` — Prisma queries
4. `teams/lib/roles.ts` — permission checks
5. `saml-sso/lib/saml-core.ts` — SAML response parsing (security-critical)

## Acceptance Criteria
- [ ] `license-check/lib/utils.test.ts` — all 17 gate functions return true
- [ ] `audit-logs/lib/handler.test.ts` — queueAuditEvent, withAuditLogging work correctly
- [ ] `contacts/lib/contacts.test.ts` — CRUD operations work
- [ ] `teams/lib/roles.test.ts` — permission checks work
- [ ] `saml-sso/lib/saml-core.test.ts` — SAML response parsing works
- [ ] `two-factor-auth/actions.test.ts` — TOTP generation and verification work
- [ ] `telemetry.test.ts` updated to match neutered behavior
- [ ] `pnpm test` passes with all new tests

## Scope
**In scope:** Unit tests for the 6 most critical EE modules
**Out of scope:** E2E tests (Playwright), component tests (per AGENTS.md)

## Dependencies
T026 (kill telemetry) should be done first so telemetry.test.ts can be properly updated.

## Rollback
N/A — tests are additive.

## Known Risks
- Prisma mocking may be complex for modules that query the database
- SAML testing requires test fixtures (sample SAML responses)
- Server OOM may prevent running full test suite locally

## Notes
- Follow AGENTS.md: "Test behavior and outcomes; avoid brittle implementation-detail tests"
- Mock network and storage boundaries through helpers from @formbricks/*
