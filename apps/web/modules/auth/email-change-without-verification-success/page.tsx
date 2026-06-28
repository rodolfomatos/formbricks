import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslate } from "@/lingodotdev/server";
import { BackToLoginButton } from "@/modules/auth/components/back-to-login-button";
import { FormWrapper } from "@/modules/auth/components/form-wrapper";
import { authOptions } from "@/modules/auth/lib/authOptions";

/**
 * Success page shown after an email change when verification is
 * disabled.  Redirects authenticated users to `/` and shows the
 * success message with a "Back to Login" button for unauthenticated
 * users.
 */
export const EmailChangeWithoutVerificationSuccessPage = async () => {
  const t = await getTranslate();
  const session: Session | null = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-gradient-radial from-slate-200 to-slate-50">
      <FormWrapper>
        <h1 className="leading-2 mb-4 text-center font-bold">
          {t("auth.email-change.email_change_success")}
        </h1>
        <p className="text-center text-sm">{t("auth.email-change.email_change_success_description")}</p>
        <hr className="my-4" />
        <BackToLoginButton />
      </FormWrapper>
    </div>
  );
};
