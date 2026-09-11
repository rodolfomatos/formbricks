/**
 * Immediately triggers a forced logout when mounted. Renders nothing.
 * Used internally when the server redirects to a logout page (e.g. session expired).
 */
"use client";

import { useEffect } from "react";
import { useSignOut } from "@/modules/auth/hooks/use-sign-out";

export const ClientLogout = () => {
  const { signOut: signOutWithAudit } = useSignOut();

  useEffect(() => {
    signOutWithAudit({
      reason: "forced_logout",
      redirectUrl: "/auth/login",
      redirect: false,
      callbackUrl: "/auth/login",
      clearWorkspaceId: true,
    });
  });
  return null;
};
