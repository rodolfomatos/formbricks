# T028 Verify — Fix root LICENSE to remove EE carve-out

**Date:** 2026-09-11
**Status:** PASS

## Gates Executed

### Gate: LICENSE header accurate
- Original header referenced `apps/web/modules/ee/LICENSE` (nonexistent file) with a "proprietary enterprise license" carve-out
- New header states `apps/web/modules/ee` "has been rewritten from scratch as original AGPLv3 code. This directory is NOT subject to any proprietary enterprise license."
- AGPLv3 full text (lines 10-670) preserved untouched
- MIT exceptions for packages/ (js, android, ios, api) preserved

### Gate: ee/LICENSE file confirmed absent
- `apps/web/modules/ee/LICENSE` → "No such file or directory"

### Gate: docs rewritten
- `docs/self-hosting/advanced/license.mdx` → rewritten: AGPL-only model, no paid gates, feature matrix now all-✅
- `docs/self-hosting/advanced/license-activation.mdx` → rewritten: "All Features Included" — no ENTERPRISE_LICENSE_KEY, no ee.formbricks.com phone-home, no firewall exceptions

## Core Finding
The initial ticket premise was **correct** on this one: the LICENSE header was self-contradictory (carved out a license that no longer exists) and docs still instructed users to set up license activation + phone-home.

## Risks Accepted
- Retaining "Copyright (c) 2024 Formbricks GmbH" — required by AGPL attribution for derived work
- The MIT carve-out for packages/ is preserved per upstream (those directories exist with MIT licenses)