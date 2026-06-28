"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

interface TermsPrivacyLinksProps {
  termsUrl?: string;
  privacyUrl?: string;
}

/**
 * Renders links to the Terms of Service and Privacy Policy pages below the
 * sign-up form. Both URLs are optional — if neither is configured the
 * component renders nothing. The URLs are configured via env vars so that
 * self-hosted instances can link to their own legal pages.
 */
export const TermsPrivacyLinks = ({ termsUrl, privacyUrl }: Readonly<TermsPrivacyLinksProps>) => {
  const { t } = useTranslation();

  if (!termsUrl && !privacyUrl) return null;

  return (
    <div className="mt-3 text-center text-xs text-slate-500">
      {termsUrl && (
        <Link className="font-semibold" href={termsUrl} rel="noreferrer" target="_blank">
          {t("auth.signup.terms_of_service")}
        </Link>
      )}
      {termsUrl && privacyUrl && <span> {t("common.and")} </span>}
      {privacyUrl && (
        <Link className="font-semibold" href={privacyUrl} rel="noreferrer" target="_blank">
          {t("auth.signup.privacy_policy")}
        </Link>
      )}
      <hr className="mx-6 mt-3"></hr>
    </div>
  );
};
