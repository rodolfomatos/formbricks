"use client";

import { Trans } from "react-i18next";

interface VerificationMessageProps {
  email: string;
}

/**
 * Displays a success message confirming that the verification email was
 * sent to the given address.  Uses react-i18next <Trans> to bold the
 * email inside the translated string via the <span> component override.
 */
export const VerificationMessage = ({ email }: VerificationMessageProps) => {
  return (
    <p className="text-center text-sm text-slate-700">
      <Trans
        i18nKey="auth.verification-requested.verification_email_successfully_sent_info"
        values={{ email }}
        components={{ span: <span className="font-semibold" /> }}
      />
    </p>
  );
};
