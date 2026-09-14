---
ticket: T032
title: Update stale documentation referencing EE model
sprint: sprint-02
priority: major
status: pending
created: 2026-09-11
---

# T032 — Update stale documentation referencing EE model

## Context
~25 docs still market the Enterprise Edition model, claiming features require a license key or Enterprise plan. These are upstream Formbricks docs that were never updated for the AGPL fork.

## Acceptance Criteria
- [ ] All docs referencing "Enterprise", "License Key", "EE features" are updated to reflect AGPL model
- [ ] `README.md:214-224` — "The Enterprise Edition" section rewritten or removed
- [ ] `docs/self-hosting/advanced/license.mdx` — rewritten for AGPL-only model
- [ ] `docs/self-hosting/advanced/license-activation.mdx` — removed or rewritten
- [ ] `docs/platform/open-source.mdx` — updated
- [ ] All `.../enterprise-features/` docs updated
- [ ] No doc claims a feature requires a license or Enterprise plan
- [ ] `apps/web/docs/` (if any) referencing EE are updated

## Scope
**In scope:** All documentation files referencing EE/licensing
**Out of scope:** Code changes (covered by other tickets)

## Dependencies
T028 (LICENSE fix) should be done first to establish the new licensing model.

## Rollback
Restore from git HEAD.

## Known Risks
- Some docs are MDX with Mintlify components — need to preserve formatting
- Upstream may have changed these docs — diffing against upstream is complex

## Notes
- Full list of affected docs provided in the hostile analysis
- Consider adding a note that this is a community fork with all features available
