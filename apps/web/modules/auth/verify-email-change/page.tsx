import { BackToLoginButton } from "@/modules/auth/components/back-to-login-button";
import { FormWrapper } from "@/modules/auth/components/form-wrapper";
import { EmailChangeSignIn } from "@/modules/auth/verify-email-change/components/email-change-sign-in";

/**
 * Email-change verification page. Extracts the JWT token from search
 * params and delegates to EmailChangeSignIn (client component) which
 * calls the verifyEmailChangeAction server action.  After success,
 * the user is signed out so they must re-authenticate with the new
 * email.
 */
export const VerifyEmailChangePage = async ({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ token: string }>;
}>) => {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen bg-gradient-radial from-slate-200 to-slate-50">
      <FormWrapper>
        <EmailChangeSignIn token={token} />
        <BackToLoginButton />
      </FormWrapper>
    </div>
  );
};
