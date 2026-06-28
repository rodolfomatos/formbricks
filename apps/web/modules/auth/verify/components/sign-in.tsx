"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";

/**
 * Auto-submits a verification token to next-auth's "token" provider on
 * mount via useEffect. Renders nothing — the parent page shows the
 * "Verifying…" message.  The token provider handles the sign-in and
 * redirects to callbackUrl on success.
 */
export const SignIn = ({ token, callbackUrl }: Readonly<{ token: string; callbackUrl: string }>) => {
  useEffect(() => {
    if (token) {
      signIn("token", {
        token: token,
        callbackUrl,
      });
    }
  }, [callbackUrl, token]);

  return <></>;
};
