---
ticket: T028
title: Fix root LICENSE to remove EE carve-out
sprint: sprint-02
priority: blocker
status: pending
created: 2026-09-11
---

# T028 — Fix root LICENSE to remove EE carve-out

## Context
The root `LICENSE` file still contains a header (line 5) that carves out `apps/web/modules/ee` as separately-licensed Enterprise Code pointing to `apps/web/modules/ee/LICENSE`. That file no longer exists — the directory is entirely original AGPL rewrite code. The license header contradicts the project's stated intent (CLAUDE.md: "Full-featured Formbricks under AGPLv3").

## Acceptance Criteria
- [ ] Root `LICENSE` header no longer references `apps/web/modules/ee` as separately licensed
- [ ] `apps/web/modules/ee/LICENSE` is confirmed deleted (should already be)
- [ ] The LICENSE file clearly states the entire project is AGPLv3
- [ ] `docs/self-hosting/advanced/license.mdx` is updated to reflect the AGPL-only model
- [ ] `docs/self-hosting/advanced/license-activation.mdx` is removed or rewritten (currently instructs setting ENTERPRISE_LICENSE_KEY)

## Scope
**In scope:** `LICENSE`, `docs/self-hosting/advanced/license.mdx`, `docs/self-hosting/advanced/license-activation.mdx`
**Out of scope:** Other docs referencing EE (covered by T032)

## Dependencies
None — legal fix.

## Rollback
Restore from git HEAD. But the current state is legally inconsistent.

## Known Risks
- The upstream LICENSE header may have specific legal meaning — modifying it should be done carefully
- If the project is distributed, the LICENSE must accurately reflect the code's licensing

## Notes
- The AGPL header at the top of LICENSE is Formbricks GmbH copyright with the carve-outs
- Consider whether to keep the Formbricks copyright attribution (AGPL requires it for the original work)
