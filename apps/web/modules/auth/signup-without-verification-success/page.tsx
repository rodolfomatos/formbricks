import { getEmailFromEmailToken } from "@/lib/jwt";
import { getTranslate } from "@/lingodotdev/server";
import { BackToLoginButton } from "@/modules/auth/components/back-to-login-button";
import { FormWrapper } from "@/modules/auth/components/form-wrapper";

/**
 * Success page shown after sign-up when email verification is disabled.
 * Extracts the email from the JWT token (for display only — no
 * verification check) and renders a success message with the email
 * and a "Back to Login" button.
 */
export const SignupWithoutVerificationSuccessPage = async ({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ token: string }>;
}>) => {
  const t = await getTranslate();
  const { token } = await searchParams;
  const email = getEmailFromEmailToken(token);

  return (
    <FormWrapper>
      <h1 className="leading-2 mb-4 text-center font-bold">
        {t("auth.signup_without_verification_success.user_successfully_created")}
      </h1>
      <p className="text-center text-sm">
        <span>{t("auth.signup_without_verification_success.user_successfully_created_info", { email })}</span>
      </p>
      <hr className="my-4" />
      <BackToLoginButton />
    </FormWrapper>
  );
};
