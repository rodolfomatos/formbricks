# T031 Verify — Remove ENTERPRISE_LICENSE_KEY from all config files

**Date:** 2026-09-11 (original); corrected 2026-09-11
**Status:** CORRECTED — original PASS was FALSE (falsified by peer review M-1); now RE-VERIFIED PASS

## Correction History

The original T031-verify executed `rg -l` — but **`rg` is not installed on this host** (`which rg` exits 1). All its "empty result set" claims were therefore false negatives: `rg` being absent returns nothing exit≠0, which was mistaken for "no matches". Peer review (M-1, BLOCKER) proved `ENTERPRISE_LICENSE_KEY` existed in **88 references across 21 files**, including `.github/workflows/e2e.yml` (with `required: true` + `exit 1` that would break fork CI without the proprietary secret), `turbo.json`, `.env.example`, `charts/formbricks/templates/secrets.yaml`, `docs/self-hosting/advanced/license-activation.mdx`, `docker/docker-compose.yml`, plus 15 locale files.

## Post-Fix Re-Verification (commit pending)

### Gate: zero ENTERPRISE_LICENSE_KEY references
```bash
grep -rn "ENTERPRISE_LICENSE_KEY" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=aes
```
- **Result: 0 lines** (was 88). `aes/` excluded intentionally: audit artifacts (tickets, peer-review findings) reference the token to document the finding cycle; they are untracked operational docs, not product code.

### Gate: no config/CI file references the license env var
- `.env.example` → removed blank entry + `# Enterprise License Key` header
- `turbo.json` → removed env passthrough entry
- `docker/docker-compose.yml` → removed ENTERPRISE EDITION block
- `charts/formbricks/templates/secrets.yaml` → removed `ENTERPRISE_LICENSE_KEY` secret template
- `.github/workflows/e2e.yml` → removed `required: true` secret, the sed-fill step, and the "Check for Enterprise License" step (fixes fork CI being unable to run)

### Gate: locales have no license-token strings
- Removed dead keys `license_invalid_description` + `recheck_license_invalid` from all 15 locale files (0 code references — verified `grep -rn` over `apps/web` non-locale = 0). Values referenced the env var; keys are inert.

## Evidence
- `grep -rn "ENTERPRISE_LICENSE_KEY" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=aes` → **0**
- `grep -c "ENTERPRISE" .github/workflows/e2e.yml charts/formbricks/templates/secrets.yaml docker/docker-compose.yml turbo.json` → **0** each
- Diff to be committed alongside T040 (peer-review blocker resolution).

## Notes
- Root cause of original false claim: reliance on a non-installed `rg` binary. All subsequent verifications in this audit must use `grep` (real tool) — now enforced across T026-T039.