import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { DatabaseError } from "@formbricks/types/errors";
import { TUserLocale } from "@formbricks/types/user";

/** Fetches the email address for a given user ID. Cached with React cache(). Returns null if user not found. */
export const getUserEmail = reactCache(async (userId: string): Promise<string | null> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });

    if (!user) {
      return null;
    }

    return user.email;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
});

/** Fetches the locale preference for a given user. Cached with React cache(). Returns undefined if user not found. */
export const getUserLocale = reactCache(async (id: string): Promise<TUserLocale | undefined> => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        locale: true,
      },
    });

    if (!user) {
      return undefined;
    }
    return user.locale;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
});
