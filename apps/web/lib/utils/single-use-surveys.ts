/**
 * Single-use survey link utilities.
 *
 * Generates, signs, and validates single-use survey IDs. Supports both plain
 * (cuid) and encrypted formats. Signatures use HMAC-SHA256 with the app's
 * encryption key for tamper resistance.
 */
import { createId, isCuid } from "@paralleldrive/cuid2";
import { createHmac, timingSafeEqual } from "node:crypto";
import { symmetricEncrypt } from "@/lib/crypto";
import { env } from "@/lib/env";

const SINGLE_USE_SIGNATURE_PAYLOAD_PREFIX = "formbricks.single-use.v1";

export type TSurveySingleUseLinkParams = {
  suId: string;
  suToken?: string;
};

const getSingleUseSigningKey = (): string => {
  if (!env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  return env.ENCRYPTION_KEY;
};

/** Generates a single-use ID (plain cuid or encrypted depending on config). */
export const generateSurveySingleUseId = (isEncrypted: boolean): string => {
  const cuid = createId();
  if (!isEncrypted) {
    return cuid;
  }

  if (!env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const encryptedCuid = symmetricEncrypt(cuid, env.ENCRYPTION_KEY);
  return encryptedCuid;
};

/** Generates a batch of `count` single-use IDs at once. */
export const generateSurveySingleUseIds = (count: number, isEncrypted: boolean): string[] => {
  const singleUseIds: string[] = [];

  for (let i = 0; i < count; i++) {
    singleUseIds.push(generateSurveySingleUseId(isEncrypted));
  }

  return singleUseIds;
};

/** Creates an HMAC-SHA256 signature for a single-use survey link. */
export const generateSurveySingleUseSignature = (surveyId: string, singleUseId: string): string => {
  const payload = `${SINGLE_USE_SIGNATURE_PAYLOAD_PREFIX}:${surveyId}:${singleUseId}`;

  return createHmac("sha256", getSingleUseSigningKey()).update(payload).digest("hex");
};

/** Validates a single-use survey link signature using timing-safe comparison. */
export const validateSurveySingleUseSignature = (
  surveyId: string,
  singleUseId: string,
  signature?: string | null
): boolean => {
  if (!signature) {
    return false;
  }

  const expectedSignature = generateSurveySingleUseSignature(surveyId, singleUseId);
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(signature);

  return expected.length === received.length && timingSafeEqual(expected, received);
};

/** Generates the URL params (suId, optional suToken) for a single-use survey link. */
export const generateSurveySingleUseLinkParams = (
  surveyId: string,
  isEncrypted: boolean,
  singleUseId?: string
): TSurveySingleUseLinkParams => {
  if (isEncrypted) {
    return { suId: generateSurveySingleUseId(true) };
  }

  const suId = singleUseId?.trim() || generateSurveySingleUseId(false);

  return {
    suId,
    suToken: generateSurveySingleUseSignature(surveyId, suId),
  };
};

/** Generates a batch of single-use survey link params. */
export const generateSurveySingleUseLinkParamsList = (
  count: number,
  surveyId: string,
  isEncrypted: boolean
): TSurveySingleUseLinkParams[] => {
  const singleUseLinkParams: TSurveySingleUseLinkParams[] = [];

  for (let i = 0; i < count; i++) {
    singleUseLinkParams.push(generateSurveySingleUseLinkParams(surveyId, isEncrypted));
  }

  return singleUseLinkParams;
};

/**
 * Validates single-use link params (suId + suToken) and returns the decrypted
 * single-use ID, or null if invalid/expired.
 */
export const validateSurveySingleUseLinkParams = ({
  surveyId,
  suId,
  suToken,
  isEncrypted,
  decrypt,
}: {
  surveyId: string;
  suId?: string | null;
  suToken?: string | null;
  isEncrypted: boolean;
  decrypt: (encryptedSingleUseId: string) => string;
}): string | null => {
  const trimmedSuId = suId?.trim();

  if (!trimmedSuId) {
    return null;
  }

  if (isEncrypted) {
    try {
      const decryptedSingleUseId = decrypt(trimmedSuId);
      return isCuid(decryptedSingleUseId) ? decryptedSingleUseId : null;
    } catch {
      return null;
    }
  }

  return validateSurveySingleUseSignature(surveyId, trimmedSuId, suToken) ? trimmedSuId : null;
};
