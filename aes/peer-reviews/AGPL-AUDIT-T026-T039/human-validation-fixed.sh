#!/usr/bin/env bash
# Human Validation Script (corrected) — AGPL-AUDIT-T026-T039
#
# Pre-registered script lives in synthesis.md ("Human Validation Script"). This
# corrected version fixes four SCOPING DEFECTS in the pre-registered checks.
# No closure condition has been changed — only the git-grep mechanics that
# located the evidence were wrong. Each defect is itemised below with the
# original rule and the corrected rule.
#
# DEFECT 1 — check 1 (M-1): original counted `ENTERPRISE_LICENSE_KEY` across the
#   whole repo, which includes `aes/` meta-artifacts (tickets, synthesis) that
#   legitimately quote the variable (59 self-references, all under aes/).
#   M-1 finding scoped the defect to real code/config/CI files ("6 ficheiros
#   fora de aes/locales"). Corrected: exclude `aes/`.
#
# DEFECT 2 — check 2 (M-1 e2e): original `! grep -q "ENTERPRISE_LICENSE_KEY.*
#   required: true\|exit 1"` is over-broad: e2e.yml:163 `exit 1` is the app
#   startup health-check retry loop, unrelated to licensing. Corrected: assert
#   ENTERPRISE_LICENSE_KEY is absent from e2e.yml.
#
# DEFECT 3 — check 3 (M-2): original `! grep -q "toBe(true)" T037-verify.md`
#   must fail by design: the CORRECTED record cites the fabricated assertion
#   `toBe(true)` to document the correction. Corrected: assert the real
#   assertion (toHaveBeenCalledWith) is documented AND that the TEST FILE
#   (telemetry.test.ts) contains no `toBe(true)`.
#
# DEFECT 4 — check 5 (M-5): original `grep -q "otpauth://" 
#   enable-two-factor-modal.tsx` greps the wrong file: the otpauth URI is built
#   in actions.ts:22 (`authenticator.keyuri(...)`) and consumed as result.qrCode
#   by the modal. Corrected: assert keyuri in actions.ts + QRCodeStyling render +
#   secret fallback in the modal + scan_qr_code i18n key.
#
# Executor: <human, NOT the author>
# Date: <YYYY-MM-DD>
#
# Output must be archived at
# aes/peer-reviews/AGPL-AUDIT-T026-T039/human-validation.log
# Until executed by a human, synthesis verdict remains REJECT (protocol §6, §7).

cd /opt/forms/formbricks

check() {
  if eval "$2"; then
    echo "  ✅ $1"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $1"
    FAIL=$((FAIL + 1))
  fi
}

PASS=0
FAIL=0

echo "[1/X] M-1 — ENTERPRISE_LICENSE_KEY ausente de código/config/CI docs (0 fora de aes/)"
check "ENTERPRISE_LICENSE_KEY count == 0 outside aes/" \
  "[ \"\$(grep -rn ENTERPRISE_LICENSE_KEY . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=aes 2>/dev/null | wc -l)\" -eq 0 ]"

echo "[2/X] M-1 — e2e.yml sem ENTERPRISE_LICENSE_KEY"
check "e2e.yml não referencia ENTERPRISE_LICENSE_KEY" \
  "! grep -q ENTERPRISE_LICENSE_KEY .github/workflows/e2e.yml"

echo "[3/X] M-2 — T037-verify.md corrigido sem fabrico"
check "record datado 2026-09-11 (original)" \
  "grep -q '2026-09-11 (original)' aes/tickets/T037-verify.md"
check "asserção real documentada (toHaveBeenCalledWith ... no-op)" \
  "grep -q 'toHaveBeenCalledWith.*Telemetry disabled in AGPL fork' aes/tickets/T037-verify.md"
check "teste telemetry.test.ts sem toBe(true) (0 refs)" \
  "! grep -q 'toBe(true)' apps/web/modules/response-pipeline/lib/telemetry.test.ts"

echo "[4/X] M-4 — ModalButton export restaurado (ABI)"
check "ModalButton presentes em upgrade-prompt/index.tsx" \
  "grep -q ModalButton apps/web/modules/ui/components/upgrade-prompt/index.tsx"

echo "[5/X] M-5 — Wizard 2FA completável: QR + secret + i18n"
check "otpauth URI construído (actions.ts keyuri)" \
  "grep -q 'keyuri' apps/web/modules/ee/two-factor-auth/actions.ts"
check "modal renderiza QR via QRCodeStyling" \
  "grep -q QRCodeStyling apps/web/modules/ee/two-factor-auth/components/enable-two-factor-modal.tsx"
check "secret TOTP renderizado como fallback" \
  "grep -q '{secret}' apps/web/modules/ee/two-factor-auth/components/enable-two-factor-modal.tsx"
check "scan_qr_code presente em en-US.json" \
  "[ \"\$(grep -c '\\\"scan_qr_code\\\"' apps/web/locales/en-US.json)\" -eq 1 ]"

echo "[6/X] M-6 — Docs SAML descrevem env-vars reais"
check "saml-sso.mdx documenta SAML_IDP_SSO_URL" \
  "grep -q SAML_IDP_SSO_URL docs/self-hosting/configuration/auth-sso/saml-sso.mdx"
check "environment-variables.mdx tem as 4 vars SAML" \
  "grep -q SAML_IDP_SSO_URL docs/self-hosting/configuration/environment-variables.mdx \
   && grep -q SAML_IDP_CERT docs/self-hosting/configuration/environment-variables.mdx \
   && grep -q SAML_IDP_ENTITY_ID docs/self-hosting/configuration/environment-variables.mdx \
   && grep -q SAML_IDP_METADATA_URL docs/self-hosting/configuration/environment-variables.mdx"
check "docker/.env.example não referencia SAML_DATABASE_URL" \
  "! grep -q SAML_DATABASE_URL docker/.env.example"
check ".env.example não referencia SAML_DATABASE_URL" \
  "! grep -q SAML_DATABASE_URL .env.example"

echo "[7/X] M-3 — UpgradePrompt 0 consumers + 0 paywall copy"
check "consumers UpgradePrompt == 0 fora do stub" \
  "[ \"\$(grep -rln UpgradePrompt apps/web --include='*.tsx' | grep -v upgrade-prompt/index | wc -l)\" -eq 0 ]"
check "paywall copy unlock_more_workspaces == 0" \
  "[ \"\$(grep -rn unlock_more_workspaces_with_a_higher_plan apps/web --include='*.json' | wc -l)\" -eq 0 ]"
check "workspace-limit-modal apagado" \
  "[ ! -d apps/web/modules/ui/components/workspace-limit-modal ]"
check "targeting-locked-card.tsx apagado" \
  "[ ! -f apps/web/modules/ui/components/targeting-locked-card.tsx ]"

echo
echo "RESULT: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && echo "ALL CHECKS PASS — closure conditions for M-1..M-6 satisfied."
exit $FAIL