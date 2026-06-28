"use server";

import { z } from "zod";
import { logger } from "@formbricks/logger";
import { OperationNotAllowedError } from "@formbricks/types/errors";
import { ZUserEmail } from "@formbricks/types/user";
import { PASSWORD_RESET_DISABLED } from "@/lib/constants";
import { actionClient } from "@/lib/utils/action-client";
import { requestPasswordReset } from "@/modules/auth/forgot-password/lib/password-reset-service";
import { getUserByEmail } from "@/modules/auth/lib/user";
import { applyIPRateLimit } from "@/modules/core/rate-limit/helpers";
import { rateLimitConfigs } from "@/modules/core/rate-limit/rate-limit-configs";

/**
 * Zod schema for forgot-password action input.
 * Only requires an email — the password reset service handles the rest
 * and always returns success:true to prevent user enumeration.
 */
const ZForgotPasswordAction = z.object({
  email: ZUserEmail,
});

/**
 * Server action for requesting a password reset email.
 * Always returns `{ success: true }` even if the email does not exist
 * or the user is an SSO-only user (identityProvider !== "email"), to
 * prevent user-enumeration attacks. Rate-limited per IP.
 *
 * @param email - Email address to send the reset link to
 * @returns { success: true }
 * @throws OperationNotAllowedError if password reset is disabled
 */
export const forgotPasswordAction = actionClient
  .inputSchema(ZForgotPasswordAction)
  .action(async ({ parsedInput }) => {
    await applyIPRateLimit(rateLimitConfigs.auth.forgotPassword);

    if (PASSWORD_RESET_DISABLED) {
      throw new OperationNotAllowedError("Password reset is disabled");
    }

    const user = await getUserByEmail(parsedInput.email);

    if (user && user.identityProvider === "email") {
      try {
        await requestPasswordReset(user, "public");
      } catch (error) {
        logger.error({ error, stage: "dispatch", userId: user.id }, "Password reset request failed");
      }
    }

    return { success: true };
  });
