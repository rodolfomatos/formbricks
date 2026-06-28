"use client";

import { signIn } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/modules/ui/components/button";

interface SSOOptionsProps {
  googleOAuthEnabled: boolean;
  githubOAuthEnabled: boolean;
  azureOAuthEnabled: boolean;
  oidcOAuthEnabled: boolean;
  oidcDisplayName?: string;
  samlSsoEnabled: boolean;
  samlTenant: string;
  samlProduct: string;
  returnToUrl: string;
  source: "signin" | "signup";
}

/**
 * Renders SSO provider buttons on the sign-in / sign-up pages.
 * Each provider is gated by its own boolean prop so the parent decides
 * which buttons to show based on server-validated environment config.
 *
 * SAML props are destructured with underscore prefixes to avoid unused-variable
 * warnings — SAML is out of scope for the AGPL fork but the parent may still pass them.
 */
export const SSOOptions = ({
  googleOAuthEnabled,
  githubOAuthEnabled,
  azureOAuthEnabled,
  oidcOAuthEnabled,
  oidcDisplayName,
  samlSsoEnabled: _samlSsoEnabled,
  samlTenant: _samlTenant,
  samlProduct: _samlProduct,
  returnToUrl,
  source: _source,
}: Readonly<SSOOptionsProps>) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      {googleOAuthEnabled && (
        <Button
          className="relative w-full justify-center"
          variant="secondary"
          onClick={() => signIn("google", { callbackUrl: returnToUrl })}>
          {t("auth.continue_with_google")}
        </Button>
      )}
      {githubOAuthEnabled && (
        <Button
          className="relative w-full justify-center"
          variant="secondary"
          onClick={() => signIn("github", { callbackUrl: returnToUrl })}>
          {t("auth.continue_with_github")}
        </Button>
      )}
      {azureOAuthEnabled && (
        <Button
          className="relative w-full justify-center"
          variant="secondary"
          onClick={() => signIn("azure-ad", { callbackUrl: returnToUrl })}>
          {t("auth.continue_with_azure")}
        </Button>
      )}
      {oidcOAuthEnabled && (
        <Button
          className="relative w-full justify-center"
          variant="secondary"
          onClick={() => signIn("openid", { callbackUrl: returnToUrl })}>
          {t("auth.continue_with_oidc", {
            oidcDisplayName: oidcDisplayName || "OpenID",
          })}
        </Button>
      )}
    </div>
  );
};
