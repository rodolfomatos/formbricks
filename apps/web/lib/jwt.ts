import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { prisma } from "@formbricks/database";
import { logger } from "@formbricks/logger";
import { ENCRYPTION_KEY, NEXTAUTH_SECRET } from "@/lib/constants";
import { symmetricDecrypt, symmetricEncrypt } from "@/lib/crypto";
import { TGatewayAuthService, getGatewayAuthServiceTokenPurpose } from "@/modules/gateway-auth/lib/service";

const FEEDBACK_RECORDS_GATEWAY_TOKEN_TTL_SECONDS = 60 * 10;

/**
 * Attempts symmetric decryption; returns the original text on failure.
 * Backwards-compat for tokens created before payload encryption was introduced.
 */
const decryptWithFallback = (encryptedText: string, key: string): string => {
  try {
    return symmetricDecrypt(encryptedText, key);
  } catch {
    return encryptedText;
  }
};

export const VERIFICATION_TOKEN_PURPOSES = ["email_verification", "sso_recovery"] as const;

export type TVerificationTokenPurpose = (typeof VERIFICATION_TOKEN_PURPOSES)[number];

export type TVerifyTokenPayload = JwtPayload & {
  id: string;
  email: string;
  purpose: TVerificationTokenPurpose;
};

type TVerificationTokenOptions = SignOptions & {
  purpose?: TVerificationTokenPurpose;
};

type TSsoRelinkIntentPayload = {
  callbackUrl: string;
  email: string;
  provider: string;
  providerAccountId: string;
  userId: string;
};

type TAccountDeletionSsoReauthIntentPayload = {
  id: string;
  email: string;
  provider: string;
  providerAccountId: string;
  purpose: "account_deletion_sso_reauth";
  returnToUrl: string;
  userId: string;
};

const DEFAULT_VERIFICATION_TOKEN_PURPOSE: TVerificationTokenPurpose = "email_verification";

const getVerificationTokenPurpose = (purpose: unknown): TVerificationTokenPurpose => {
  if (purpose && VERIFICATION_TOKEN_PURPOSES.includes(purpose as TVerificationTokenPurpose)) {
    return purpose as TVerificationTokenPurpose;
  }

  return DEFAULT_VERIFICATION_TOKEN_PURPOSE;
};

/**
 * Creates a verification token (email verification or SSO recovery).
 * The userId is encrypted before embedding.
 *
 * @param userId — the user to create the token for
 * @param options — JWT sign options + optional purpose
 * @returns — signed JWT string
 */
export const createToken = (userId: string, options: TVerificationTokenOptions = {}): string => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const encryptedUserId = symmetricEncrypt(userId, ENCRYPTION_KEY);
  const { purpose = DEFAULT_VERIFICATION_TOKEN_PURPOSE, ...jwtOptions } = options;

  return jwt.sign({ id: encryptedUserId, purpose }, NEXTAUTH_SECRET, jwtOptions);
};

/**
 * Creates a short-lived gateway auth token for internal microservice communication.
 *
 * @param userId — the user the token acts on behalf of (sub claim)
 * @param service — which gateway service to authorise
 * @returns — the token and its ISO expiry timestamp
 */
export const createGatewayServiceToken = (
  userId: string,
  service: TGatewayAuthService
): {
  token: string;
  expiresAt: string;
} => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  const token = jwt.sign({ purpose: getGatewayAuthServiceTokenPurpose(service) }, NEXTAUTH_SECRET, {
    algorithm: "HS256",
    expiresIn: FEEDBACK_RECORDS_GATEWAY_TOKEN_TTL_SECONDS,
    subject: userId,
  });

  const decodedToken = jwt.decode(token);
  if (!decodedToken || typeof decodedToken !== "object" || typeof decodedToken.exp !== "number") {
    throw new Error("Failed to create feedback records gateway token");
  }

  return {
    token,
    expiresAt: new Date(decodedToken.exp * 1000).toISOString(),
  };
};

/** Convenience wrapper: creates a feedback-records gateway token. */
export const createFeedbackRecordsGatewayToken = (
  userId: string
): {
  token: string;
  expiresAt: string;
} => {
  return createGatewayServiceToken(userId, "feedbackRecords");
};

/**
 * Creates a token that allows a respondent to access a link survey.
 * The email is encrypted; surveyId is stored in plaintext for routing.
 *
 * @param surveyId — the survey
 * @param userEmail — the respondent's email (encrypted in payload)
 * @returns — the signed JWT
 */
export const createTokenForLinkSurvey = (surveyId: string, userEmail: string): string => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const encryptedEmail = symmetricEncrypt(userEmail, ENCRYPTION_KEY);
  return jwt.sign({ email: encryptedEmail, surveyId }, NEXTAUTH_SECRET);
};

/**
 * Verifies an email-change token and returns the decrypted userId + new email.
 *
 * @param token — the JWT to verify
 * @returns — decrypted { id, email }
 */
export const verifyEmailChangeToken = async (token: string): Promise<{ id: string; email: string }> => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const payload = jwt.verify(token, NEXTAUTH_SECRET, { algorithms: ["HS256"] }) as {
    id: string;
    email: string;
  };

  if (!payload?.id || !payload?.email) {
    throw new Error("Token is invalid or missing required fields");
  }

  // Decrypt both fields with fallback
  const decryptedId = decryptWithFallback(payload.id, ENCRYPTION_KEY);
  const decryptedEmail = decryptWithFallback(payload.email, ENCRYPTION_KEY);

  return {
    id: decryptedId,
    email: decryptedEmail,
  };
};

/**
 * Verifies a gateway service token and returns the user ID from the sub claim.
 *
 * @param token — the JWT to verify
 * @param service — the expected service (purpose must match)
 * @returns — the authenticated userId
 */
export const verifyGatewayServiceToken = (
  token: string,
  service: TGatewayAuthService
): {
  userId: string;
} => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  const payload = jwt.verify(token, NEXTAUTH_SECRET, { algorithms: ["HS256"] }) as JwtPayload & {
    purpose?: string;
    sub?: string;
  };

  if (payload.purpose !== getGatewayAuthServiceTokenPurpose(service) || !payload.sub) {
    throw new Error("Invalid feedback records gateway token");
  }

  return {
    userId: payload.sub,
  };
};

/** Convenience wrapper: verifies a feedback-records gateway token. */
export const verifyFeedbackRecordsGatewayToken = (
  token: string
): {
  userId: string;
} => {
  return verifyGatewayServiceToken(token, "feedbackRecords");
};

/** Creates a short-lived (1 day) token for confirming an email change. */
export const createEmailChangeToken = (userId: string, email: string): string => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const encryptedUserId = symmetricEncrypt(userId, ENCRYPTION_KEY);
  const encryptedEmail = symmetricEncrypt(email, ENCRYPTION_KEY);

  const payload = {
    id: encryptedUserId,
    email: encryptedEmail,
  };

  return jwt.sign(payload, NEXTAUTH_SECRET, {
    expiresIn: "1d",
  });
};

/** Creates a bare email-verification token with just the encrypted email. */
export const createEmailToken = (email: string): string => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const encryptedEmail = symmetricEncrypt(email, ENCRYPTION_KEY);
  return jwt.sign({ email: encryptedEmail }, NEXTAUTH_SECRET);
};

/** Extracts and decrypts the email from an email-only token. */
export const getEmailFromEmailToken = (token: string): string => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const payload = jwt.verify(token, NEXTAUTH_SECRET, { algorithms: ["HS256"] }) as JwtPayload & {
    email: string;
  };
  return decryptWithFallback(payload.email, ENCRYPTION_KEY);
};

/**
 * Creates a token for a workspace invitation.
 * Both the invite ID and the email are encrypted.
 *
 * @param inviteId — the DB invite record ID
 * @param email — the invitee's email
 * @param options — extra JWT sign options
 */
export const createInviteToken = (inviteId: string, email: string, options = {}): string => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const encryptedInviteId = symmetricEncrypt(inviteId, ENCRYPTION_KEY);
  const encryptedEmail = symmetricEncrypt(email, ENCRYPTION_KEY);
  return jwt.sign({ inviteId: encryptedInviteId, email: encryptedEmail }, NEXTAUTH_SECRET, options);
};

/**
 * Verifies a link-survey token with fallback to legacy (surveyId-concatenated secret).
 *
 * @param token — the JWT
 * @param surveyId — the expected survey (checked against payload.surveyId if present)
 * @returns — the decrypted email, or null on failure
 */
export const verifyTokenForLinkSurvey = (token: string, surveyId: string): string | null => {
  if (!NEXTAUTH_SECRET) {
    return null;
  }

  try {
    let payload: JwtPayload & { email: string; surveyId?: string };

    // Try primary method first (consistent secret)
    try {
      payload = jwt.verify(token, NEXTAUTH_SECRET, { algorithms: ["HS256"] }) as JwtPayload & {
        email: string;
        surveyId: string;
      };
    } catch (primaryError) {
      logger.error(primaryError, "Token verification failed with primary method");

      // Fallback to legacy method (surveyId-based secret)
      try {
        payload = jwt.verify(token, NEXTAUTH_SECRET + surveyId, { algorithms: ["HS256"] }) as JwtPayload & {
          email: string;
        };
      } catch (legacyError) {
        logger.error(legacyError, "Token verification failed with legacy method");
        throw new Error("Invalid token");
      }
    }

    // Verify the surveyId matches if present in payload (new format)
    if (payload.surveyId && payload.surveyId !== surveyId) {
      return null;
    }

    const { email } = payload;
    if (!email) {
      return null;
    }

    // Decrypt email with fallback to plain text
    if (!ENCRYPTION_KEY) {
      return email; // Return as-is if encryption key not set
    }

    return decryptWithFallback(email, ENCRYPTION_KEY);
  } catch (error) {
    logger.error(error, "Survey link token verification failed");
    return null;
  }
};

// Helper function to get user email for legacy verification
const getUserEmailForLegacyVerification = async (
  token: string,
  userId?: string
): Promise<{ userId: string; userEmail: string }> => {
  if (!userId) {
    const decoded = jwt.decode(token);

    // Validate decoded token structure before using it
    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.id ||
      typeof decoded.id !== "string" ||
      decoded.id.trim() === ""
    ) {
      logger.error("Invalid token: missing or invalid user ID");
      throw new Error("Invalid token");
    }

    userId = decoded.id;
  }

  const decryptedId = decryptWithFallback(userId, ENCRYPTION_KEY);

  // Validate decrypted ID before database query
  if (!decryptedId || typeof decryptedId !== "string" || decryptedId.trim() === "") {
    logger.error("Invalid token: missing or invalid user ID");
    throw new Error("Invalid token");
  }

  const foundUser = await prisma.user.findUnique({
    where: { id: decryptedId },
  });

  if (!foundUser) {
    const errorMessage = "User not found";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  return { userId: decryptedId, userEmail: foundUser.email };
};

const DEFAULT_SSO_RELINK_INTENT_OPTIONS: SignOptions = {
  expiresIn: "15m",
};

const DEFAULT_ACCOUNT_DELETION_SSO_REAUTH_INTENT_OPTIONS: SignOptions = {
  expiresIn: "10m",
};

/**
 * Creates a short-lived (15m) token for SSO account re-linking.
 * All sensitive fields (userId, email, providerAccountId, callbackUrl) are encrypted.
 */
export const createSsoRelinkIntent = (
  payload: TSsoRelinkIntentPayload,
  options: SignOptions = DEFAULT_SSO_RELINK_INTENT_OPTIONS
): string => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  return jwt.sign(
    {
      userId: symmetricEncrypt(payload.userId, ENCRYPTION_KEY),
      email: symmetricEncrypt(payload.email, ENCRYPTION_KEY),
      provider: payload.provider,
      providerAccountId: symmetricEncrypt(payload.providerAccountId, ENCRYPTION_KEY),
      callbackUrl: symmetricEncrypt(payload.callbackUrl, ENCRYPTION_KEY),
    },
    NEXTAUTH_SECRET,
    options
  );
};

/** Verifies and decrypts an SSO re-link intent token. */
export const verifySsoRelinkIntent = (token: string): TSsoRelinkIntentPayload => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const payload = jwt.verify(token, NEXTAUTH_SECRET, { algorithms: ["HS256"] }) as JwtPayload & {
    userId: string;
    email: string;
    provider: string;
    providerAccountId: string;
    callbackUrl: string;
  };

  if (
    !payload?.userId ||
    !payload?.email ||
    !payload?.provider ||
    !payload?.providerAccountId ||
    !payload?.callbackUrl
  ) {
    throw new Error("Token is invalid or missing required fields");
  }

  return {
    userId: decryptWithFallback(payload.userId, ENCRYPTION_KEY),
    email: decryptWithFallback(payload.email, ENCRYPTION_KEY),
    provider: payload.provider,
    providerAccountId: decryptWithFallback(payload.providerAccountId, ENCRYPTION_KEY),
    callbackUrl: decryptWithFallback(payload.callbackUrl, ENCRYPTION_KEY),
  };
};

/**
 * Creates a short-lived (10m) token for SSO re-authentication before account deletion.
 */
export const createAccountDeletionSsoReauthIntent = (
  payload: TAccountDeletionSsoReauthIntentPayload,
  options: SignOptions = DEFAULT_ACCOUNT_DELETION_SSO_REAUTH_INTENT_OPTIONS
): string => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  return jwt.sign(
    {
      id: symmetricEncrypt(payload.id, ENCRYPTION_KEY),
      userId: symmetricEncrypt(payload.userId, ENCRYPTION_KEY),
      email: symmetricEncrypt(payload.email, ENCRYPTION_KEY),
      provider: payload.provider,
      providerAccountId: symmetricEncrypt(payload.providerAccountId, ENCRYPTION_KEY),
      purpose: payload.purpose,
      returnToUrl: symmetricEncrypt(payload.returnToUrl, ENCRYPTION_KEY),
    },
    NEXTAUTH_SECRET,
    options
  );
};

/** Verifies and decrypts an account-deletion SSO re-auth token. */
export const verifyAccountDeletionSsoReauthIntent = (
  token: string
): TAccountDeletionSsoReauthIntentPayload => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const payload = jwt.verify(token, NEXTAUTH_SECRET, { algorithms: ["HS256"] }) as JwtPayload & {
    id: string;
    userId: string;
    email: string;
    provider: string;
    providerAccountId: string;
    purpose: string;
    returnToUrl: string;
  };

  if (
    !payload?.id ||
    !payload?.userId ||
    !payload?.email ||
    !payload?.provider ||
    !payload?.providerAccountId ||
    payload?.purpose !== "account_deletion_sso_reauth" ||
    !payload?.returnToUrl
  ) {
    throw new Error("Token is invalid or missing required fields");
  }

  return {
    id: decryptWithFallback(payload.id, ENCRYPTION_KEY),
    userId: decryptWithFallback(payload.userId, ENCRYPTION_KEY),
    email: decryptWithFallback(payload.email, ENCRYPTION_KEY),
    provider: payload.provider,
    providerAccountId: decryptWithFallback(payload.providerAccountId, ENCRYPTION_KEY),
    purpose: "account_deletion_sso_reauth",
    returnToUrl: decryptWithFallback(payload.returnToUrl, ENCRYPTION_KEY),
  };
};

/**
 * Verifies a verification token with fallback.
 * Tries the current secret first; on failure, fetches the user's email and
 * retries with the legacy email-concatenated secret.
 *
 * @param token — the JWT
 * @returns — decrypted payload with id, email, and purpose
 */
export const verifyToken = async (token: string): Promise<TVerifyTokenPayload> => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  let payload: JwtPayload & { id: string };
  let userData: { userId: string; userEmail: string } | null = null;

  // Try new method first, with smart fallback to legacy
  try {
    payload = jwt.verify(token, NEXTAUTH_SECRET, { algorithms: ["HS256"] }) as JwtPayload & {
      id: string;
    };
  } catch (newMethodError) {
    logger.error(newMethodError, "Token verification failed with new method");

    // Get user email for legacy verification
    userData = await getUserEmailForLegacyVerification(token);

    // Try legacy verification with email-based secret
    try {
      payload = jwt.verify(token, NEXTAUTH_SECRET + userData.userEmail, {
        algorithms: ["HS256"],
      }) as JwtPayload & {
        id: string;
      };
    } catch (legacyMethodError) {
      logger.error(legacyMethodError, "Token verification failed with legacy method");
      throw new Error("Invalid token");
    }
  }

  if (!payload?.id) {
    throw new Error("Invalid token");
  }

  // Get user email if we don't have it yet
  userData ??= await getUserEmailForLegacyVerification(token, payload.id);

  return {
    id: userData.userId,
    email: userData.userEmail,
    purpose: getVerificationTokenPurpose(payload.purpose),
  };
};

/**
 * Verifies and decrypts an invite token.
 *
 * @param token — the JWT
 * @returns — decrypted { inviteId, email }
 */
export const verifyInviteToken = (token: string): { inviteId: string; email: string } => {
  if (!NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  try {
    const payload = jwt.verify(token, NEXTAUTH_SECRET, { algorithms: ["HS256"] }) as JwtPayload & {
      inviteId: string;
      email: string;
    };

    const { inviteId: encryptedInviteId, email: encryptedEmail } = payload;

    if (!encryptedInviteId || !encryptedEmail) {
      throw new Error("Invalid token");
    }

    // Decrypt both fields with fallback to original values
    const decryptedInviteId = decryptWithFallback(encryptedInviteId, ENCRYPTION_KEY);
    const decryptedEmail = decryptWithFallback(encryptedEmail, ENCRYPTION_KEY);

    return {
      inviteId: decryptedInviteId,
      email: decryptedEmail,
    };
  } catch (error) {
    logger.error(error, "Error verifying invite token");
    throw new Error("Invalid or expired invite token");
  }
};
