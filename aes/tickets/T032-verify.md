# T032 Verify — Update stale docs referencing EE model

**Date:** 2026-09-11
**Status:** PASS

## Gates Executed

### Gate: no docs instruct users to buy/upgrade to enable a feature
- Full `grep` sweep across `docs/` (real grep, not rg): every `<Note>/<Note>` + `<Note>` block that said
  "X is part of the [Enterprise Edition]" has been rewritten to say the feature is available in this
  AGPL fork without a license key
- Feature-gating upper `<Note>` blocks resolved in: two-factor-auth, teams-and-roles, organizations-and-roles,
  email-branding, ai-features, advanced-targeting, user-identification, personal-links, email-followups,
  spam-protection, multi-language-surveys, whitelabel-follow-ups, oidc (keycloak/google-oauth/azure-ad/saml-sso/keycloak-oidc),
  rate-limiting (license recheck row), self-hosting/overview (hosting table), kubernetes, migration (3.0 warning),
  headless-surveys (EE fork note), google-tag-manager (user-id row), quota-management, open-source (EE table)
- Zero remaining "In the Community Edition... you cannot" downgrade-language refs

### Gate: no doc gate remains misleading for fork users
- Every `enterpriseLicenseRequestFormUrl`-style deep link removed from docs or pointed to the fork license page
- `ENTERPRISE_LICENSE_REQUEST_FORM_URL` never referenced in docs

## Notes
- Follows the same fork-correct narrative already applied to open-source.mdx + overview.mdx in the rewrite
- Docs that are pure changelog/history (migration's historical & upgrade notes) were left intentionally intact
- The fork LICENSE page (docs/self-hosting/advanced/license) is the single source of truth for licensing language
