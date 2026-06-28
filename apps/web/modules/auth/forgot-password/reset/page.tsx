import { FormWrapper } from "@/modules/auth/components/form-wrapper";
import { ResetPasswordForm } from "@/modules/auth/forgot-password/reset/components/reset-password-form";

/**
 * Reset-password page (served from the email link).  Renders the
 * ResetPasswordForm client component inside the standard card layout.
 * The token is read from search params by the client component.
 */
export const ResetPasswordPage = () => {
  return (
    <FormWrapper>
      <ResetPasswordForm />
    </FormWrapper>
  );
};
