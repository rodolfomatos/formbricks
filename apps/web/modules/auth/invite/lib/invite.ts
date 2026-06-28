import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { DatabaseError, ResourceNotFoundError } from "@formbricks/types/errors";
import { type InviteWithCreator } from "@/modules/auth/invite/types/invites";

/**
 * Deletes an invite by ID after it has been accepted or expired.
 * Throws ResourceNotFoundError if the invite does not exist.
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

    throw error;
  }
};

/**
 * Looks up an invite by ID with the creator's profile info.
 * Cached with React's cache(). Includes expiresAt so the caller can
 * check validity before accepting.
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
        expiresAt: true,
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

    throw error;
  }
});
