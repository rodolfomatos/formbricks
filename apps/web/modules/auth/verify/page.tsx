import { cookies } from "next/headers";
import { WEBAPP_URL } from "@/lib/constants";
import { getTranslate } from "@/lingodotdev/server";
import { FormWrapper } from "@/modules/auth/components/form-wrapper";
import { getAuthCallbackUrlFromCookies, resolveAuthCallbackUrl } from "@/modules/auth/lib/callback-url";
import { SignIn } from "@/modules/auth/verify/components/sign-in";

/**
 * Email-verification landing page. Reads the token from search params,
 * resolves the callback URL (with cookie fallback), and renders the
 * SignIn client component that auto-submits the token to next-auth's
 * "token" provider on mount.  If no token is present, shows an error.
 */
export const VerifyPage = async ({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ token?: string; callbackUrl?: string | string[] }>;
}>) => {
  const t = await getTranslate();
  const [params, cookieStore] = await Promise.all([searchParams, cookies()]);
  const { token, callbackUrl } = params;
  const resolvedCallbackUrl =
    resolveAuthCallbackUrl({
      searchParamCallbackUrl: callbackUrl,
      cookieCallbackUrl: getAuthCallbackUrlFromCookies(cookieStore),
      allowCookieFallback: true,
      webAppUrl: WEBAPP_URL,
    }) ?? WEBAPP_URL;

  return token ? (
    <FormWrapper>
      <p className="text-center">{t("auth.verify.verifying")}</p>
      <SignIn token={token} callbackUrl={resolvedCallbackUrl} />
    </FormWrapper>
  ) : (
    <p className="text-center">{t("auth.verify.no_token_provided")}</p>
  );
};
