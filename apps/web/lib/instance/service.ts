/**
 * Service layer for instance-level metadata.
 *
 * Checks whether this Formbricks deployment is a "fresh" instance (no users yet)
 * or has no organisations at all. These checks drive the first-user onboarding
 * flow and the setup wizard.
 */
import "server-only";
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { DatabaseError } from "@formbricks/types/errors";

/**
 * Returns true when no users exist in the database — the instance has just been
 * installed and needs a first admin account. Used by the setup wizard.
 *
 * @returns — true if the instance has zero users
 */
export const getIsFreshInstance = reactCache(async (): Promise<boolean> => {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) return true;
    else return false;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }
    throw error;
  }
});

/**
 * Returns true when no organisations exist. Used to gate certain multi-org
 * setup flows that require at least one organisation to exist.
 *
 * @returns — true if there are zero organisations
 */
export const getHasNoOrganizations = reactCache(async (): Promise<boolean> => {
  try {
    const organizationCount = await prisma.organization.count();
    return organizationCount === 0;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }
    throw error;
  }
});
