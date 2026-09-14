---
ticket: T030
title: Commit critical untracked files (SAML SSO, Makefile, AES)
sprint: sprint-02
priority: blocker
status: pending
created: 2026-09-11
---

# T030 — Commit critical untracked files

## Context
The git working tree has 107 untracked files, many of which are load-bearing for the deployed system. A fresh clone would be missing:
- `apps/web/app/api/auth/saml/login/route.ts` (SAML SSO initiation endpoint)
- `apps/web/modules/ee/saml-sso/` (entire SAML SSO module)
- `apps/web/modules/ee/whitelabel/actions.ts` (branding actions)
- `Makefile` (build orchestration)
- `aes/` directory (project management)
- `scripts/verify-implementation.sh` (AC verification)

The working tree also has 1,695 modified files (the EE stripping). These need to be committed in a structured way.

## Acceptance Criteria
- [ ] All 107 untracked files are committed (except secrets and junk)
- [ ] The 1,695 modified files are committed (the EE→AGPL rewrite)
- [ ] The commit history clearly documents what changed and why
- [ ] `docker/.env` is NOT committed (covered by T027)
- [ ] `modules/` at root is NOT committed (covered by T029)
- [ ] `packages/design-system/` is NOT committed (covered by T034)
- [ ] A single "AGPL rewrite" commit or structured commit series exists

## Scope
**In scope:** All tracked and untracked files in the working tree
**Out of scope:** Pushing to remote (that's a separate step after review)

## Dependencies
- T027 (docker/.env) and T029 (modules/) should be resolved first to avoid committing secrets/junk

## Rollback
`git checkout .` and `git clean -fd` — but this destroys all uncommitted work.

## Known Risks
- Committing 1,695 files in one shot makes the commit hard to review
- Some modified files may have conflicts with upstream changes
- The Prisma schema changes (AuditLog model, User fields) need to be included

## Notes
- Consider splitting into: (1) EE deletion commit, (2) AGPL rewrite commit, (3) new features commit
- The 3 uncommitted commits ahead of origin (auth fix, OOM fix, docstrings) also need to be included
