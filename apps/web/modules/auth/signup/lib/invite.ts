import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { logger } from "@formbricks/logger";
import { DatabaseError, ResourceNotFoundError } from "@formbricks/types/errors";
import { InviteWithCreator } from "@/modules/auth/signup/types/invites";

/**
 * Deletes an invite by ID. Throws ResourceNotFoundError if the invite does
 * not exist. Called after invite acceptance to clean up the used invite.
 *
 * @param inviteId - Invite ID to delete
 * @returns true on success
 */
export const deleteInvite = async (inviteId: string): Promise<boolean> => {
  try {
    const invite = await prisma.invite.delete({
      where: {
        id: inviteId,
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!invite) {
      throw new ResourceNotFoundError("Invite", inviteId);
    }

    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }
    throw new DatabaseError(error instanceof Error ? error.message : "Unknown error occurred");
  }
};

/**
 * Looks up an invite by ID. Cached with React's cache(). Returns the invite
 * with the creator's name, email, and locale for sending the accepted email.
 *
 * @param inviteId - Invite ID to look up
 * @returns Invite with creator info, or null
 */
export const getInvite = reactCache(async (inviteId: string): Promise<InviteWithCreator | null> => {
  try {
    const invite = await prisma.invite.findUnique({
      where: {
        id: inviteId,
      },
      select: {
        id: true,
        organizationId: true,
        role: true,
        teamIds: true,
        creator: {
          select: {
            name: true,
            email: true,
            locale: true,
          },
        },
      },
    });

    return invite;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }
    throw new DatabaseError(error instanceof Error ? error.message : "Unknown error occurred");
  }
});

/**
 * Checks whether an invite is valid (exists and not expired).
 * Returns false instead of throwing on errors so the SSO callback can
 * reject gracefully rather than returning a 500.
 *
 * @param inviteId - Invite ID to validate
 * @returns true if the invite exists and has not expired
 */
export const getIsValidInviteToken = reactCache(async (inviteId: string): Promise<boolean> => {
  try {
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) {
      return false;
    }
    if (!invite.expiresAt || isNaN(invite.expiresAt.getTime())) {
      logger.error(
        {
          inviteId,
          expiresAt: invite.expiresAt,
        },
        "SSO: Invite token expired"
      );
      return false;
    }
    if (invite.expiresAt < new Date()) {
      logger.error(
        {
          inviteId,
          expiresAt: invite.expiresAt,
        },
        "SSO: Invite token expired"
      );
      return false;
    }
    return true;
  } catch (err) {
    logger.error(err, "Error getting invite");
    return false;
  }
});
