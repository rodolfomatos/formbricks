---
ticket: T005
title: "Wizard 2FA não completável: 13 chaves i18n em falta + placeholder qr_code_placeholder em vez de QR/secret"
phase: ticket
status: done
sprint: backlog
priority: medium
created: '2026-09-14'
requires: []
produces: []
blocked_by: ''
---

# T005 — Wizard 2FA não completável: 13 chaves i18n em falta + placeholder qr_code_placeholder em vez de QR/secret

## Origin

Review finding from aes-peer-review.
- **Type:** MAJOR
- **Evidence:** peer-review AGPL-AUDIT-T026-T039 findings (M-5)
- **Rubric criterion:** U-01

## Closure Condition

enable-two-factor-modal.tsx renders qrCode (otpauth) or secret, e grep -c 'scan_qr_code' en-US.json > 0

This ticket is **done** when the closure condition above is verifiably met.

## Resolution (2026-09-14)

- `enable-two-factor-modal.tsx` now renders the real QR code from the `otpauth://` URI returned by
  `enableTwoFactorAuth` using `qr-code-styling` (via the shared `getQRCodeOptions` helper, same pattern
  as `qr-code-tab.tsx`), with the raw TOTP secret shown below for manual entry as fallback.
- Placeholder string `qr_code_placeholder` removed from the component.
- All `t()` calls across the four 2FA components (`enable-two-factor-modal`, `disable-two-factor-modal`,
  `two-factor-backup`, `two-factor`) now use the `common.` namespace — previously unqualified keys
  (`cancel`, `next`, `verify`, etc.) never resolved because localizations are top-level namespaced.
- Added 14 missing keys to `apps/web/locales/en-US.json` under `common`: `backup_codes`,
  `backup_codes_warning`, `disable_two_factor_auth`, `disable_two_factor_auth_description`,
  `enable_two_factor_auth`, `enter_secret_manually`, `enter_the_code_from_your_authenticator_app`,
  `invalid_code`, `save_backup_codes`, `scan_qr_code`, `two_factor_auth`, `two_factor_auth_description`,
  `verify`, `verify_code`.
- Verified: `grep -c '"scan_qr_code"' locales/en-US.json` = 1; eslint clean on all four components.
