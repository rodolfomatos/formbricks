"use server";

import { z } from "zod";
import { InvalidInputError } from "@formbricks/types/errors";
import { createEmailToken } from "@/lib/jwt";
import { getUserByEmail } from "@/lib/user/service";
import { actionClient } from "@/lib/utils/action-client";

/**
 * Zod schema for create-email-token action input.
 * Email must be a valid format, between 5 and 255 characters.
 * The bounds prevent excessive input sizes hitting the JWT creation layer.
 */
const ZCreateEmailTokenAction = z.object({
  email: z
    .email({
      error: "Invalid email",
    })
    .min(5)
    .max(255),
});

/**
 * Server action that creates a one-time email verification token.
 * Only succeeds if a user with the given email exists — prevents
 * token generation for unregistered addresses.
 *
 * @param email - User email to send the verification token to
 * @returns The generated email verification token string
 * @throws InvalidInputError if no user with that email exists
 */
export const createEmailTokenAction = actionClient
  .inputSchema(ZCreateEmailTokenAction)
  .action(async ({ parsedInput }) => {
    const user = await getUserByEmail(parsedInput.email);
    if (!user) {
      throw new InvalidInputError("Invalid request");
    }

    return createEmailToken(parsedInput.email);
  });
