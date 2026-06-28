import { signOut } from "next-auth/react";
import { logger } from "@formbricks/logger";
import { FORMBRICKS_ENVIRONMENT_ID_LS, FORMBRICKS_WORKSPACE_ID_LS } from "@/lib/localStorage";
import { logSignOutAction } from "@/modules/auth/actions/sign-out";

interface UseSignOutOptions {
  reason?:
    | "user_initiated"
    | "account_deletion"
    | "email_change"
    | "session_timeout"
    | "forced_logout"
    | "password_reset";
  redirectUrl?: string;
  organizationId?: string;
  redirect?: boolean;
  callbackUrl?: string;
  clearWorkspaceId?: boolean;
}

interface SessionUser {
  id: string;
  email?: string;
}

/**
 * Client-side hook that wraps NextAuth's signOut with audit logging
 * and optional workspace/environment ID cleanup from localStorage.
 * The audit event is sent via server action before the session is destroyed.
 * If audit logging fails, sign-out proceeds anyway (non-blocking).
 *
 * @param sessionUser - Current user (if known) for audit log context
 * @returns Object with typed signOut function
 */
export const useSignOut = (sessionUser?: SessionUser | null) => {
  const signOutWithAudit = async (options?: UseSignOutOptions) => {
    // Log audit event before signing out (server action)
    if (sessionUser?.id) {
      try {
        await logSignOutAction(sessionUser.id, sessionUser.email ?? "", {
          reason: options?.reason || "user_initiated", // NOSONAR // We want to check for empty strings
          redirectUrl: options?.redirectUrl || options?.callbackUrl, // NOSONAR // We want to check for empty strings
          organizationId: options?.organizationId,
        });
      } catch (error) {
        // Don't block signOut if audit logging fails
        logger.error(
          error instanceof Error ? error : new Error(String(error)),
          "Failed to log signOut event"
        );
      }
    }

    if (options?.clearWorkspaceId) {
      localStorage.removeItem(FORMBRICKS_WORKSPACE_ID_LS);
      localStorage.removeItem(FORMBRICKS_ENVIRONMENT_ID_LS);
    }

    // Call NextAuth signOut
    return await signOut({
      redirect: options?.redirect,
      callbackUrl: options?.callbackUrl,
    });
  };

  return { signOut: signOutWithAudit };
};
