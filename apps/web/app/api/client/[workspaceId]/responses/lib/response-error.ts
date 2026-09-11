import { Prisma } from "@formbricks/database/prisma";
import type { PrismaClientKnownRequestError } from "@formbricks/database/prisma";
import { PrismaErrorType } from "@formbricks/database/types/error";

/** Type guard that checks if an error is a PrismaClientKnownRequestError. */
export const isPrismaKnownRequestError = (error: unknown): error is PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError;

/**
 * Checks whether a Prisma known-request error is a unique constraint
 * violation on the `singleUseId` field.
 */
export const isSingleUseIdUniqueConstraintError = (error: PrismaClientKnownRequestError): boolean => {
  if (error.code !== PrismaErrorType.UniqueConstraintViolation) {
    return false;
  }

  return Array.isArray(error.meta?.target) && error.meta.target.includes("singleUseId");
};
