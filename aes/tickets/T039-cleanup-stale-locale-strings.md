---
ticket: T039
title: Clean up stale EE locale strings
sprint: sprint-02
priority: minor
status: pending
created: 2026-09-11
---

# T039 — Clean up stale EE locale strings

## Context
19 locale JSON files contain `license_invalid_description` and `recheck_license_invalid` strings that reference the Enterprise license model. These keys are no longer used in the AGPL fork.

## Acceptance Criteria
- [ ] `license_invalid_description` key removed from all 19 locale files
- [ ] `recheck_license_invalid` key removed from all 19 locale files
- [ ] Any other license-related i18n keys no longer referenced in code are removed
- [ ] `pnpm i18n` passes without errors

## Scope
**In scope:** `apps/web/locales/*.json` (19 files)
**Out of scope:** The license-check module itself

## Dependencies
None.

## Rollback
Restore from git HEAD.

## Known Risks
- Need to verify these keys are truly unreferenced before removing
- i18n tooling may behave differently if keys are missing

## Notes
- Affected locales: en-US, ru-RU, zh-Hant-TW, nl-NL, de-DE, tr-TR, pt-PT, ja-JP, ro-RO, hu-HU, es-ES, pt-BR, fr-FR, sv-SE, zh-Hans-CN, and others
- Run `grep -r "license_invalid" apps/web/` to find all references before removing
