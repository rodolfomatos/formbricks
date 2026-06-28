import { cookies } from "next/headers";
import { logger } from "@formbricks/logger";
import { ZUserEmail } from "@formbricks/types/user";
import { WEBAPP_URL } from "@/lib/constants";
import { getEmailFromEmailToken } from "@/lib/jwt";
import { getTranslate } from "@/lingodotdev/server";
import { FormWrapper } from "@/modules/auth/components/form-wrapper";
import { getAuthCallbackUrlFromCookies, resolveAuthCallbackUrl } from "@/modules/auth/lib/callback-url";
import { RequestVerificationEmail } from "@/modules/auth/verification-requested/components/request-verification-email";
import { VerificationMessage } from "@/modules/auth/verification-requested/components/verification-message";

/**
 * Post-signup verification landing page.  Parses the email from the JWT
 * token in search params, validates it against the ZUserEmail schema,
 * and renders either the success message with a resend button or an
 * error message (invalid email / invalid token).  The callbackUrl is
 * resolved from search params or cookie for post-verification redirect.
 */
  const t = await getTranslate();
  const [params, cookieStore] = await Promise.all([searchParams, cookies()]);
  const { token, callbackUrl } = params;
  const resolvedCallbackUrl = resolveAuthCallbackUrl({
    searchParamCallbackUrl: callbackUrl,
    cookieCallbackUrl: getAuthCallbackUrlFromCookies(cookieStore),
    allowCookieFallback: true,
    webAppUrl: WEBAPP_URL,
  });
  try {
    const email = getEmailFromEmailToken(token);
    const parsedEmail = ZUserEmail.safeParse(email);
    if (parsedEmail.success) {
      return (
        <FormWrapper>
          <>
            <h1 className="leading-2 mb-4 text-center text-lg font-semibold text-slate-900">
              {t("auth.verification-requested.please_confirm_your_email_address")}
            </h1>
            <VerificationMessage email={email} />
            <hr className="my-4" />
            <p className="text-center text-xs text-slate-500">
              {t("auth.verification-requested.you_didnt_receive_an_email_or_your_link_expired")}
            </p>
            <div className="mt-5">
              <RequestVerificationEmail email={email.toLowerCase()} callbackUrl={resolvedCallbackUrl} />
            </div>
          </>
        </FormWrapper>
      );
    } else {
      return (
        <FormWrapper>
          <p className="text-center">{t("auth.verification-requested.invalid_email_address")}</p>
        </FormWrapper>
      );
    }
  } catch (error) {
    logger.error(error, "Invalid token");
    return (
      <FormWrapper>
        <p className="text-center">{t("auth.verification-requested.invalid_token")}</p>
      </FormWrapper>
    );
  }
};
