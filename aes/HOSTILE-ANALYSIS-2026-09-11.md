# Hostile Analysis — Formbricks AGPL Fork Audit
**Date:** 2026-09-11
**Analyst:** AES Protocol (big-pickle)
**Scope:** Full codebase audit of the EE→AGPL migration

---

## INSIGHTS CONSULTED
- aes/kanban.md (T001-T025 status)
- aes/sprints/sprint-01.md, sprint-02.md
- CLAUDE.md (project contract)
- apps/web/modules/ee/* (88 rewritten files)
- /opt/ee-backup/ee/ (99 original files, reference only)
- docker/.env, docker/docker-compose.yml
- apps/web/Dockerfile
- apps/web/modules/response-pipeline/lib/telemetry.ts

---

## ASSUMPTIONS I'M MAKING

- [KNOWN] The fork's intent is full AGPLv3 with zero EE traces — stated in CLAUDE.md line 4
- [KNOWN] All 15 EE features were rewritten from scratch — per T003 plan and sprint-02
- [INFERRED] The deployment at forms.ilab.uporto.pt is live and serving users — per docker/.env OIDC config
- [INFERRED] The server has 3.8GB RAM / 2 CPU — per CLAUDE.md line 91
- [ASSUMED] The telemetry endpoint at ee.formbricks.com is Formbricks' proprietary endpoint — impact if false: may be a public API (unlikely given naming)
- [UNKNOWN] Whether any user data has been transmitted to ee.formbricks.com since deployment — requires server log analysis

---

## WHAT WASN'T SPECIFIED (that matters)

1. **No threat model defined** — what adversaries? Legal (Formbricks GmbH)? Technical? Regulatory (GDPR for UPorto)?
2. **No data classification** — survey responses may contain personal data from UPorto students/staff
3. **No incident response plan** — if phone-home was active, what's the remediation?
4. **No audit trail requirement** — when was each change deployed? Can we prove AGPL compliance?

---

## ALTERNATIVES I DIDN'T CHOOSE

- Option A: Fix issues in-place and commit — rejected because the working tree is too diverged; need structured tickets
- Option B: Reset to HEAD and redo — rejected because SAML SSO and other untracked work would be lost
- Option C: Create tickets, fix sequentially, commit per ticket — CHOSEN: preserves audit trail, enables review

---

## INVITE CONTRADICTION

- **What if the telemetry is actually needed?** — The AGPL license does not prohibit telemetry, but CLAUDE.md line 37 says "❌ Include ANY EE license validation or phone-home". The telemetry POSTs usage data to a Formbricks enterprise endpoint. Even if non-malicious, it violates the project's own never-do list.
- **What if the docker/.env was intentionally committed?** — Some teams use git-crypt or similar. Here it's plain text with live OIDC secrets. This is a security vulnerability regardless of intent.
- **What critical flaw might I be missing?** — The Prisma schema may have been modified to add EE fields (User.twoFactorSecret, AuditLog model). If these changes are in the working tree but not committed, a migration on a fresh clone would fail.

---

## DISTINGUISH CLAIM TYPES

**Empirical (what is):**
- telemetry.ts:276 POSTs to ee.formbricks.com — VERIFIABLE
- docker/.env contains live secrets in git — VERIFIABLE
- 1,695 files modified/untracked in working tree — VERIFIABLE
- Zero unit tests in apps/web/modules/ee/ — VERIFIABLE

**Normative (what should be):**
- A fork claiming "no EE phone-home" should not POST to ee.formbricks.com — NORMATIVE
- Live secrets should not be in version control — NORMATIVE (but also a security best practice)
- All rewritten modules should have tests — NORMATIVE (per AGENTS.md guidelines)

---

## RISKS & SIDE EFFECTS

| Risk | Severity | Impact |
|------|----------|--------|
| Phone-home active in production | CRITICAL | User data may leak to Formbricks; legal exposure for UPorto |
| Secrets in git history | HIGH | Anyone with repo access has OIDC credentials |
| Uncommitted SAML SSO code | HIGH | Fresh clone loses SSO entirely; production drift |
| LICENSE file contradicts AGPL claim | MEDIUM | Legal vulnerability if audited |
| modules/ ships into Docker image | MEDIUM | Potentially EE-derived code in production image |
| Zero test coverage on EE rewrites | MEDIUM | Regressions undetectable without manual testing |
| Stale docs marketing EE features | LOW | Confusing for contributors; misleading README |

---

## COST OF BEING WRONG

**HIGH** — This is a university deployment handling survey data. The phone-home issue could have GDPR implications. The secrets exposure could compromise SSO authentication for the entire institution.

---

## SCOPE BOUNDARIES

This analysis covers:
- The Formbricks fork at /opt/forms/formbricks/
- The deployment at /opt/formbricks/
- The backup at /opt/ee-backup/

This analysis deliberately excludes:
- The AES system itself at /opt/aes/ (out of scope)
- The ECC skills at /opt/ECC/ (out of scope)
- Upstream Formbricks changes (we track from a fixed point)
