import { prisma } from "@formbricks/database";
import { logger } from "@formbricks/logger";
import { POSTHOG_KEY } from "@/lib/constants";
import { capturePostHogEvent } from "@/lib/posthog";
import { updateUserLastLoginAt } from "@/modules/auth/lib/user";

/**
 * Checks whether the user's lastLoginAt is on a different calendar day than
 * today in UTC. Used to distinguish first-login-of-day (a common product
 * analytics signal) from repeated same-day sign-ins.
 */
const getIsFirstLoginToday = (lastLoginAt: Date | null | undefined) =>
  lastLoginAt?.toISOString().slice(0, 10) !== new Date().toISOString().slice(0, 10);

/**
 * Sends a PostHog "user_signed_in" event with auth provider, organisation
 * count, and whether this is the user's first login today. No-op if PostHog
 * is not configured.
 *
 * The previousLastLoginAt param avoids an extra DB query when the caller has
 * already fetched it (e.g. from updateUserLastLoginAt's return value).
 *
 * @param userId              - User ID for the event
 * @param provider            - Auth provider used (credentials, openid, google, etc.)
 * @param previousLastLoginAt - Pre-fetched lastLoginAt (fetched from DB if absent)
 */
export const captureSignIn = async ({
  userId,
  provider,
  previousLastLoginAt,
}: {
  userId: string;
  provider: string;
  previousLastLoginAt?: Date | null;
}) => {
  if (!POSTHOG_KEY) {
    return;
  }

  try {
    const membershipCountPromise = prisma.membership.count({ where: { userId } });
    const resolvedPreviousLastLoginAt =
      previousLastLoginAt === undefined
        ? (
            await prisma.user.findUnique({
              where: { id: userId },
              select: { lastLoginAt: true },
            })
          )?.lastLoginAt
        : previousLastLoginAt;
    const membershipCount = await membershipCountPromise;

    capturePostHogEvent(userId, "user_signed_in", {
      auth_provider: provider,
      organization_count: membershipCount,
      is_first_login_today: getIsFirstLoginToday(resolvedPreviousLastLoginAt),
    });
  } catch (error) {
    logger.warn({ error }, "Failed to capture PostHog sign-in event");
  }
};

/**
 * Completes the sign-in process after a successful auth: updates the
 * lastLoginAt timestamp and fires a PostHog analytics event (fire-and-forget).
 * Intended to be called from authOptions callbacks after the auth decision
 * has been made.
 *
 * @param userId   - User ID
 * @param email    - User email (for lastLoginAt update lookup)
 * @param provider - Auth provider used
 */
export const finalizeSuccessfulSignIn = async ({
  userId,
  email,
  provider,
}: {
  userId: string;
  email: string;
  provider: string;
}) => {
  const previousLastLoginAt = await updateUserLastLoginAt(email);
  void captureSignIn({ userId, provider, previousLastLoginAt });
};
