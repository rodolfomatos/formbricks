# T027 Verify — docker/.env secret exposure

**Date:** 2026-09-11  
**Status:** PASS — No action required (premise corrected)

## Initial Claim (Incorrect)
The Phase 0 reconnaissance reported that `docker/.env` was "committed to the repo with live secrets" (NEXTAUTH_SECRET, ENCRYPTION_KEY, OIDC_CLIENT_SECRET, etc.).

## Actual Verified State

### 1. docker/.env — NOT TRACKED
- `git check-ignore docker/.env` → returns `docker/.env` (exit 0)
- `git ls-files docker/.env` → "did not match any file(s) known to git"
- Root `.gitignore` line `**/.env` already ignores all `.env` files

### 2. apps/web/.env — Tracked symlink (safe)
- `git show HEAD:apps/web/.env` → `../../.env` (symlink target string only)
- The blob content is the string `../../.env`, NOT the secret values
- This is the standard Next.js symlink pattern (source controlled, target local)

### 3. Git history scan — All secrets clean
| Secret Variable | git log -S result |
|-----------------|-------------------|
| NEXTAUTH_SECRET | clean |
| ENCRYPTION_KEY | clean |
| CRON_SECRET | clean |
| HUB_API_KEY | clean |
| CUBEJS_API_SECRET | clean |
| OIDC_CLIENT_SECRET | clean |

### 4. apps/web/.env is explicitly un-ignored (by design)
- `.gitignore` contains `!apps/web/.env` to track the symlink
- The symlink target (`../../.env`) is gitignored via `**/.env`
- Pattern: source-controlled symlink, local-only secret file

## Conclusion
**No secret exposure exists.** The `docker/.env` file has never been committed to git.

## Hardening Applied
- Created `docker/.env.example` with placeholder values (T027 AC item)
- `.gitignore` already correct (`**/.env` pattern)
- No history rewrite needed — no secrets were ever exposed

## Root Cause of Initial False Report
The exploration agent saw `apps/web/.env` in `git ls-files` (tracked) and incorrectly attributed it to `docker/.env`. The symlink blob content (`../../.env`) was not the secrets themselves.