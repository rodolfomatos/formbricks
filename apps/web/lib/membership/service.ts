/**
 * Service layer for Memberships — the join table linking users to organisations.
 *
 * Memberships carry a role (owner, manager, member, billing) that governs what
 * the user can do within the organisation. Reads are cached via React's `cache()`
 * except when a Prisma transaction handle is provided (to avoid stale reads inside
 * a transaction).
 */
import "server-only";
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { Prisma, PrismaClient } from "@formbricks/database/prisma";
import { logger } from "@formbricks/logger";
import { ZString } from "@formbricks/types/common";
import { DatabaseError, UnknownError } from "@formbricks/types/errors";
import { TMembership, ZMembership } from "@formbricks/types/memberships";
import { validateInputs } from "../utils/validate";

type TMembershipDbClient = PrismaClient | Prisma.TransactionClient;

const getDbClient = (tx?: Prisma.TransactionClient): TMembershipDbClient => tx ?? prisma;

const getMembershipByUserIdOrganizationIdUncached = async (
  userId: string,
  organizationId: string,
  tx?: Prisma.TransactionClient
): Promise<TMembership | null> => {
  validateInputs([userId, ZString], [organizationId, ZString]);

  try {
    const membership = await getDbClient(tx).membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) return null;

    return membership;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error(error, "Error getting membership by user id and organization id");
      throw new DatabaseError(error.message);
    }

    throw new UnknownError("Error while fetching membership");
  }
};

const getMembershipByUserIdOrganizationIdCached = reactCache(async (userId: string, organizationId: string) =>
  getMembershipByUserIdOrganizationIdUncached(userId, organizationId)
);

/**
 * Retrieves a membership record, bypassing the cache when a transaction handle is passed.
 * This is the single entry-point for membership reads so callers don't need to remember
 * which internal function handles caching vs. transaction support.
 *
 * @param userId — the user
 * @param organizationId — the organisation
 * @param tx — optional transaction handle (bypasses cache)
 * @returns — the membership, or null
 */
export const getMembershipByUserIdOrganizationId = async (
  userId: string,
  organizationId: string,
  tx?: Prisma.TransactionClient
): Promise<TMembership | null> => {
  if (tx) {
    return getMembershipByUserIdOrganizationIdUncached(userId, organizationId, tx);
  }

  return getMembershipByUserIdOrganizationIdCached(userId, organizationId);
};

/**
 * Creates or updates a membership record. If the user already has a membership
 * with the same role, the existing record is returned unchanged (idempotent).
 *
 * @param organizationId — the organisation to add the user to
 * @param userId — the user
 * @param data — accepted status and role
 * @param tx — optional transaction handle
 * @returns — the created or existing membership
 */
export const createMembership = async (
  organizationId: string,
  userId: string,
  data: Partial<TMembership>,
  tx?: Prisma.TransactionClient
): Promise<TMembership> => {
  validateInputs([organizationId, ZString], [userId, ZString], [data, ZMembership.partial()]);

  try {
    const prismaClient = getDbClient(tx);
    const existingMembership = await prismaClient.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (existingMembership && existingMembership.role === data.role) {
      return existingMembership;
    }

    let membership: TMembership;
    if (!existingMembership) {
      membership = await prismaClient.membership.create({
        data: {
          userId,
          organizationId,
          accepted: data.accepted,
          role: data.role as TMembership["role"],
        },
      });
    } else {
      membership = await prismaClient.membership.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        data: {
          accepted: data.accepted,
          role: data.role as TMembership["role"],
        },
      });
    }

    return membership;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};
