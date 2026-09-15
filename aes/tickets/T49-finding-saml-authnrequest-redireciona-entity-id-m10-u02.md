---
ticket: T049
title: "SAML AuthnRequest redireciona para ENTITY_ID em vez de SSO_URL (M-10, U-02)"
phase: ticket
status: done
sprint: backlog
priority: medium
created: '2026-09-15'
requires: []
produces: []
blocked_by: ''
---

# T049 — SAML AuthnRequest redireciona para ENTITY_ID em vez de SSO_URL (M-10, U-02)

## Origin

Review finding from aes-peer-review (AGPL-AUDIT-T026-T039, M-10).
- **Type:** MINOR
- **Evidence:** `apps/web/modules/ee/saml-sso/lib/authn-request.ts:18` — usa `SAML_IDP_ENTITY_ID ?? SAML_ACS_URL` em vez de `SAML_IDP_SSO_URL ?? SAML_ACS_URL`; quando entity ID é definido, o AuthnRequest é enviado ao entity ID (não ao endpoint SSO), produzindo redirect quebrado.
- **Rubric criterion:** U-02

## Closure Condition

`authn-request.ts` (ou a rota login) redireciona para `SAML_IDP_SSO_URL` independentemente do `SAML_IDP_ENTITY_ID`, com um teste unitário que afirma o host do redirect igual ao SSO URL quando entity ID está explicitamente definido.

## Acceptance Criteria

- [x] authn-request.ts usa SAML_IDP_SSO_URL para o redirect target
- [x] teste unitário (authn-request.test.ts, 2 pass) com SAML_IDP_ENTITY_ID definido confirma redirect host = SSO URL
- [x] login route continua funcional (import/createSamlAuthnRequestRedirect intact)

## Resolution (2026-09-15)

- `authn-request.ts:18` — swapped `SAML_IDP_ENTITY_ID ?? SAML_ACS_URL` → `SAML_IDP_SSO_URL ?? SAML_ACS_URL`; import updated (`SAML_IDP_ENTITY_ID` removed).
- Added `authn-request.test.ts` (2 tests):
  1. redirect host = `SAML_IDP_SSO_URL` even when `SAML_IDP_ENTITY_ID` points to a different host (M-10 regression)
  2. falls back to `SAML_ACS_URL` when `SAML_IDP_SSO_URL` is null
- Verified: `vitest run modules/ee/saml-sso/lib/authn-request.test.ts` → 2 passed. Prettier clean.