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
  oidcPrimary?: boolean;
}

/**
 * Renders SSO provider buttons on the sign-in / sign-up pages.
 * Each provider is gated by its own boolean prop so the parent decides
 * which buttons to show based on server-validated environment config.
 */
export const SSOOptions = ({
  googleOAuthEnabled,
  githubOAuthEnabled,
  azureOAuthEnabled,
  oidcOAuthEnabled,
  oidcDisplayName,
  samlSsoEnabled,
  samlTenant: _samlTenant,
  samlProduct: _samlProduct,
  returnToUrl,
  source: _source,
  oidcPrimary = false,
}: Readonly<SSOOptionsProps>) => {
  const { t } = useTranslation();

  const providers = [
    oidcOAuthEnabled && {
      id: "openid",
      label: t("auth.continue_with_oidc", { oidcDisplayName: oidcDisplayName || "OpenID" }),
      variant: oidcPrimary ? "default" : "secondary",
      priority: oidcPrimary ? 0 : 3,
    },
    googleOAuthEnabled && {
      id: "google",
      label: t("auth.continue_with_google"),
      variant: "secondary",
      priority: 1,
    },
    githubOAuthEnabled && {
      id: "github",
      label: t("auth.continue_with_github"),
      variant: "secondary",
      priority: 2,
    },
    azureOAuthEnabled && {
      id: "azure-ad",
      label: t("auth.continue_with_azure"),
      variant: "secondary",
      priority: 4,
    },
    samlSsoEnabled && {
      id: "saml",
      label: t("auth.continue_with_saml"),
      variant: "secondary",
      priority: 5,
    },
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    variant: "default" | "secondary";
    priority: number;
  }>;

  providers.sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-2" role="list">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          className="relative w-full justify-center"
          variant={provider.variant}
          role="listitem"
          onClick={() => signIn(provider.id, { callbackUrl: returnToUrl })}>
        {provider.label}
        </Button>
      ))}
    </div>
  );
};
