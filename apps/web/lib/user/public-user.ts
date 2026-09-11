/**
 * Shared Prisma select definition for public user data.
 *
 * Used by the user service and anywhere else that needs to fetch a non-sensitive
 * subset of user fields (no password hash, no TOTP secrets, etc.).
 */
import { Prisma } from "@formbricks/database/prisma";

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  twoFactorEnabled: true,
  identityProvider: true,
  notificationSettings: true,
  locale: true,
  lastLoginAt: true,
  isActive: true,
} as const satisfies Prisma.UserSelect;

export type TPublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;
