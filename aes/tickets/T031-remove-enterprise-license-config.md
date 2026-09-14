---
ticket: T031
title: Remove ENTERPRISE_LICENSE_KEY from all config files
sprint: sprint-02
priority: major
status: pending
created: 2026-09-11
---

# T031 — Remove ENTERPRISE_LICENSE_KEY from config files

## Context
`ENTERPRISE_LICENSE_KEY` is referenced in 6+ config files despite being prohibited by CLAUDE.md. These are vestiges of the upstream EE model that were never cleaned up.

## Acceptance Criteria
- [ ] `.env.example:323` — `ENTERPRISE_LICENSE_KEY=` removed or clearly marked as unused
- [ ] `docker/docker-compose.yml:70` — commented block about EE features removed
- [ ] `turbo.json:262` — removed from build env allowlist
- [ ] `charts/formbricks/templates/secrets.yaml:47` — Helm secret removed
- [ ] `charts/formbricks/values.yaml:27-29` — Helm value removed
- [ ] `.github/workflows/e2e.yml` — EE key references removed
- [ ] 19 locale files — `license_invalid_description`, `recheck_license_invalid` keys removed
- [ ] `apps/web/lib/constants.ts:26` — `ENTERPRISE_LICENSE_REQUEST_FORM_URL = ""` removed

## Scope
**In scope:** All config files referencing ENTERPRISE_LICENSE_KEY
**Out of scope:** The license-check module itself (that's the stub, correctly returning true)

## Dependencies
None.

## Rollback
Restore from git HEAD. But these references are misleading in an AGPL fork.

## Known Risks
- Removing from Helm charts affects deployment for anyone using them
- Locale string removal may break i18n if keys are still referenced in code
- The E2E workflow currently hard-fails without the key — removing it changes CI behavior

## Notes
- The actual code layer (`apps/web/lib/env.ts`, `apps/web/lib/constants.ts`) is clean — only config/docs remain
