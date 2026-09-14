---
ticket: T027
title: Remove docker/.env from git tracking (secrets exposure)
sprint: sprint-02
priority: blocker
status: pending
created: 2026-09-11
---

# T027 — Remove docker/.env from git tracking

## Context
`docker/.env` contains live production secrets (NEXTAUTH_SECRET, ENCRYPTION_KEY, OIDC_CLIENT_SECRET, etc.) and is tracked by git. Anyone with repo access has full credentials for the UPorto SSO deployment. This is a security vulnerability.

## Acceptance Criteria
- [ ] `docker/.env` is removed from git tracking (git rm --cached)
- [ ] `docker/.env` is added to `.gitignore`
- [ ] A `docker/.env.example` template exists with placeholder values
- [ ] Existing secrets in git history are documented (cannot be easily removed without force-push)
- [ ] The git history exposure is noted as a risk in CLAUDE.md or docs

## Scope
**In scope:** `.gitignore`, `docker/.env`, `docker/.env.example`
**Out of scope:** Rotating the actual secrets (that's a separate operational task for the admin)

## Dependencies
None — security fix.

## Rollback
`git checkout HEAD -- docker/.env` (but this re-exposes secrets)

## Known Risks
- Secrets already exist in git history. Even after removing from tracking, they remain in past commits. A force-push or history rewrite would be needed to truly remove them — but that's a team decision.
- If `.env` is removed from tracking but not from `.gitignore`, future deployments might not have it.

## Notes
- `docker/.env` has 20+ environment variables with live values
- The `.gitignore` at fork root only ignores root `.env`, not `docker/.env`
