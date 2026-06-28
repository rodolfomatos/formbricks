"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { Button } from "@/modules/ui/components/button";
import { resendVerificationEmailAction } from "../actions";

interface RequestVerificationEmailProps {
  email: string | null;
  callbackUrl?: string | null;
}

/**
 * Resend-verification-email button with auto-reload on tab focus.
 * When the user switches back to this tab (visibilitychange → visible),
 * the page reloads to pick up the just-confirmed email state.
 * The resend button calls resendVerificationEmailAction on click.
 */
export const RequestVerificationEmail = ({ email, callbackUrl }: RequestVerificationEmailProps) => {
  const { t } = useTranslation();
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        location.reload();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const requestVerificationEmail = async () => {
    if (!email) return toast.error(t("auth.verification-requested.no_email_provided"));
    const response = await resendVerificationEmailAction({
      email,
      callbackUrl: callbackUrl ?? undefined,
    });
    if (response?.data) {
      toast.success(t("auth.verification-requested.verification_email_resent_successfully"));
    } else {
      const errorMessage = getFormattedErrorMessage(response);
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={requestVerificationEmail} className="w-full justify-center">
        {t("auth.verification-requested.resend_verification_email")}
      </Button>
    </>
  );
};
