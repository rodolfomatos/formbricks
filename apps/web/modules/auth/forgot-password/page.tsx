import { FormWrapper } from "@/modules/auth/components/form-wrapper";
import { ForgotPasswordForm } from "@/modules/auth/forgot-password/components/forgot-password-form";

/**
 * Forgot-password landing page.  Wraps the ForgotPasswordForm client
 * component in the standard FormWrapper card layout.
 */
export const ForgotPasswordPage = () => {
  return (
    <FormWrapper>
      <ForgotPasswordForm />
    </FormWrapper>
  );
};
