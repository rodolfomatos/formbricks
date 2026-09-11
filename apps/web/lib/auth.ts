import { compare, hash } from "bcryptjs";
import { prisma } from "@formbricks/database";
import { AuthenticationError } from "@formbricks/types/errors";

/**
 * Bcrypt hash for passwords with a cost factor of 12.
 *
 * @param password — the raw password to hash
 * @returns — bcrypt hash string
 */
export const hashPassword = async (password: string) => {
  const hashedPassword = await hash(password, 12);
  return hashedPassword;
};

/**
 * Constant-time comparison of a raw password against a stored bcrypt hash.
 *
 * @param password — the raw password to verify
 * @param hashedPassword — stored bcrypt hash
 * @returns — true if the password matches
 */
export const verifyPassword = async (password: string, hashedPassword: string) => {
  const isValid = await compare(password, hashedPassword);
  return isValid;
};

/**
 * Checks whether a user has any membership record in the given organisation.
 * This is the most basic access gate — every other authority check depends on it.
 *
 * @param userId — the user to check
 * @param organizationId — the target organisation
 * @returns — true if the user is a member
 */
export const hasOrganizationAccess = async (userId: string, organizationId: string): Promise<boolean> => {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  return !!membership;
};

/**
 * Checks whether the user has a manager or owner role within the organisation.
 * Managers and owners can perform administrative actions (manage members, configure settings).
 *
 * @param userId — the user to check
 * @param organizationId — the target organisation
 * @returns — true if the user is a manager or owner
 */
export const isManagerOrOwner = async (userId: string, organizationId: string) => {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (membership && (membership.role === "owner" || membership.role === "manager")) {
    return true;
  }

  return false;
};

/**
 * Checks whether the user is the organisation owner (highest privilege level).
 *
 * @param userId — the user to check
 * @param organizationId — the target organisation
 * @returns — true if the user is the owner
 */
export const isOwner = async (userId: string, organizationId: string) => {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (membership && membership.role === "owner") {
    return true;
  }

  return false;
};

/**
 * Guards an operation that requires manager or owner privileges.
 * Throws `AuthenticationError` with a descriptive message if the user lacks access or authority.
 *
 * @param userId — the user to authorise
 * @param organizationId — the target organisation
 * @returns — true when authorised
 */
export const hasOrganizationAuthority = async (userId: string, organizationId: string) => {
  const hasAccess = await hasOrganizationAccess(userId, organizationId);
  if (!hasAccess) {
    throw new AuthenticationError("Not authorized");
  }

  const isManagerOrOwnerAccess = await isManagerOrOwner(userId, organizationId);
  if (!isManagerOrOwnerAccess) {
    throw new AuthenticationError("You are not the manager or owner of this organization");
  }

  return true;
};

/**
 * Guards an operation that requires owner-level privileges (e.g. deleting the organisation).
 * Throws `AuthenticationError` if the user is not a member or not the owner.
 *
 * @param userId — the user to authorise
 * @param organizationId — the target organisation
 * @returns — true when authorised
 */
export const hasOrganizationOwnership = async (userId: string, organizationId: string) => {
  const hasAccess = await hasOrganizationAccess(userId, organizationId);
  if (!hasAccess) {
    throw new AuthenticationError("Not authorized");
  }

  const isOwnerAccess = await isOwner(userId, organizationId);
  if (!isOwnerAccess) {
    throw new AuthenticationError("You are not the owner of this organization");
  }

  return true;
};
