# UTILIZADOR Findings — AGPL-AUDIT-T026-T039

Persona bias: "Does this help me or get in my way?" Findings below are based only
on executed commands and file contents in this repository.

---

## [MAJOR] 2FA enable wizard cannot be completed — renders raw missing i18n keys and a placeholder instead of the QR/secret

Evidence: `apps/web/modules/ee/two-factor-auth/components/enable-two-factor-modal.tsx:30-44,68-88` — `enableTwoFactorAuth()` result (secret, qrCode) is fetched into state but never rendered; the `qr` step shows only `<span>{t("qr_code_placeholder")}</span>`. 13 of the 21 `t()` keys used by the 2FA components are absent from `apps/web/locales/en-US.json` (`two_factor_auth`, `scan_qr_code`, `qr_code_placeholder`, `verify_code`, `invalid_code`, `backup_codes`, `save_backup_codes`, `backup_codes_warning`, `enable_two_factor_auth`, `disable_two_factor_auth`, `disable_two_factor_auth_description`, `enter_the_code_from_your_authenticator_app`, `two_factor_auth_description` — `grep -c "\"scan_qr_code\"" locales/en-US.json` = 0), so react-i18next renders the raw key strings. `actions.ts:22,31` returns only an `otpauth://` URI, never an image or the secret; the docs promise "scan the displayed QR code … manually enter the provided secret key" (`docs/platform/features/user-management/two-factor-auth.mdx:32-34`). A user cannot obtain a code to pass the `verify` step.

Closure condition: `enable-two-factor-modal.tsx` renders the QR (image of `qrCode`) or the `secret` in the `qr` step, and every key above exists in en-US.json (grep or `pnpm i18n` passes).

Rubric criterion: U-01

---

## [MAJOR] SAML SSO self-hosting docs instruct a flow the fork does not implement; the only working configuration is undocumented

Evidence: `docs/self-hosting/configuration/auth-sso/saml-sso.mdx:11,22-23,72,88,97-98` tell the operator to configure `SAML_DATABASE_URL`, create `connection.xml` in `formbricks/saml-connection`, and use BoxyHQ Jackson. `grep -rn "jackson|boxyhq|connection.xml" apps/web` returns 0; the clean-room implementation is env-var only — `modules/ee/saml-sso/lib/constants.ts:17` `SAML_SSO_ENABLED = !!(SAML_IDP_SSO_URL && SAML_IDP_CERT)`, parsing in `lib/saml-core.ts`, redirect in `lib/authn-request.ts`. `SAML_XML_DIR = "./saml-connection"` (lib/constants.ts:51) and `SAML_DATABASE_URL` are unused leftovers; advertised alternative `SAML_IDP_METADATA_URL` (modules/ee/saml-sso/lib/constants.ts:13) is read nowhere and cannot enable SAML without the cert. The working vars appear in zero docs files and zero env examples (`grep -rn "SAML_IDP" docker/.env.example docs/self-hosting/configuration/environment-variables.mdx` = empty), so a self-hoster following the shipped docs cannot enable SAML.

Closure condition: saml-sso.mdx rewritten to env-var steps and `SAML_IDP_SSO_URL`/`SAML_IDP_CERT` documented in environment-variables.mdx and docker/.env.example; dead vars (`SAML_IDP_METADATA_URL`, `SAML_XML_DIR`, `SAML_DATABASE_URL`) removed or implemented (grep-verify).

Rubric criterion: U-01

---

## [MINOR] SAML AuthnRequest redirect targets SAML_IDP_ENTITY_ID instead of the IdP SSO URL

Evidence: `apps/web/modules/ee/saml-sso/lib/authn-request.ts:16-20` builds the redirect from `SAML_IDP_ENTITY_ID ?? SAML_ACS_URL`, assigning it to `idpSsoUrl`; `modules/ee/saml-sso/lib/constants.ts:9` sets `SAML_IDP_ENTITY_ID = env.SAML_IDP_ENTITY_ID ?? SAML_IDP_SSO_URL`. When an operator sets `SAML_IDP_ENTITY_ID` (a documented var, CLAUDE.md "IdP entity ID"), the SAMLRequest is sent to the entityID string rather than the IdP SSO endpoint, producing a broken login redirect/dead-end; only the default (unset) case coincidentally resolves to the SSO URL.

Closure condition: `lib/authn-request.ts` (or the login route) redirects to `SAML_IDP_SSO_URL` regardless of `SAML_IDP_ENTITY_ID`, with a unit test asserting the redirect host equals the SSO URL when entity ID is explicitly set.

Rubric criterion: U-02

---

## [MINOR] 2FA onboarding docs promise steps the implementation does not provide (password gate, 10 backup codes)

Evidence: `docs/platform/features/user-management/two-factor-auth.mdx:29-40` documents a `Confirm Password` first step and `Save the 10 backup codes`; `apps/web/modules/ee/two-factor-auth/components/enable-two-factor-modal.tsx:29` has no password step (flow is qr → verify → backup), and `actions.ts:78` generates `Array.from({ length: 8 })` backup codes. The doc's "xxxxx-xxxxx" backup code format also does not match the unadorned 10-char lowercase codes produced by actions.ts:78 and shown in two-factor-backup.tsx:16-20. Combined with the placeholder QR (finding 1), the written onboarding cannot be followed.

Closure condition: two-factor-auth.mdx matches the implementation (remove the password-confirm step or add the gate; state 8 codes and the actual format) or the implementation is changed to match the doc.

Rubric criterion: U-01