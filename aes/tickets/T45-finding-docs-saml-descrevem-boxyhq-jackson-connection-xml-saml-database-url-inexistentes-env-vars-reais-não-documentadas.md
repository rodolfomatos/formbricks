---
ticket: T006
title: "Docs SAML descrevem BoxyHQ/Jackson/connection.xml/SAML_DATABASE_URL inexistentes; env-vars reais não documentadas"
phase: ticket
status: done
sprint: backlog
priority: medium
created: '2026-09-14'
requires: []
produces: []
blocked_by: ''
---

# T006 — Docs SAML descrevem BoxyHQ/Jackson/connection.xml/SAML_DATABASE_URL inexistentes; env-vars reais não documentadas

## Origin

Review finding from aes-peer-review.
- **Type:** MAJOR
- **Evidence:** peer-review AGPL-AUDIT-T026-T039 findings (M-6)
- **Rubric criterion:** U-01

## Closure Condition

saml-sso.mdx sem jackson/connection.xml/SAML_DATABASE_URL; SAML_IDP_SSO_URL e SAML_IDP_CERT documentados em environment-variables.mdx e docker/.env.example

This ticket is **done** when the closure condition above is verifiably met.

## Resolution (2026-09-14)

- Rewrote `docs/self-hosting/configuration/auth-sso/saml-sso.mdx` with accurate AGPL fork implementation:
  - Removed all BoxyHQ/Jackson references, `SAML_DATABASE_URL`, `connection.xml` setup
  - Documented native SAML 2.0 flow (AuthnRequest → IdP redirect → HTTP-POST ACS callback → assertion validation → auto-provisioning)
  - Added sequence diagram, configuration steps, troubleshooting
- Updated `docs/self-hosting/configuration/environment-variables.mdx`: replaced `SAML_DATABASE_URL` row with `SAML_IDP_SSO_URL`, `SAML_IDP_CERT`, `SAML_IDP_ENTITY_ID`, `SAML_IDP_METADATA_URL`
- Updated `docker/.env.example` and `.env.example`: removed legacy `SAML_DATABASE_URL` comment; added `SAML_IDP_SSO_URL`, `SAML_IDP_CERT`, `SAML_IDP_ENTITY_ID`, `SAML_IDP_METADATA_URL` examples
- Verified: grep shows no jackson/boxyhq/SAML_DATABASE_URL/connection.xml in saml-sso.mdx; new env vars present in both env files and env-vars doc
