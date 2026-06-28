import { getTranslate } from "@/lingodotdev/server";
import { BackToLoginButton } from "@/modules/auth/components/back-to-login-button";
import { FormWrapper } from "@/modules/auth/components/form-wrapper";

/**
 * Confirmation page shown after requesting a password reset email.
 * Displays a generic "check your email" message regardless of
 * whether the email actually exists in the system (enumeration
 * prevention) and a "Back to Login" button.
 */
export const EmailSentPage = async () => {
  const t = await getTranslate();
  return (
    <FormWrapper>
      <div>
        <h1 className="leading-2 mb-4 text-center font-bold">
          {t("auth.forgot-password.email-sent.heading")}
        </h1>
        <p className="text-center">{t("auth.forgot-password.email-sent.text")}</p>
        <div className="mt-5 text-center">
          <BackToLoginButton />
        </div>
      </div>
    </FormWrapper>
  );
};
