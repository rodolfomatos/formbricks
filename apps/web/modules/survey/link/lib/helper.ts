import "server-only";
import { validateSurveySingleUseId } from "@/app/lib/singleUseSurveys";
import { verifyTokenForLinkSurvey } from "@/lib/jwt";
import { validateSurveySingleUseLinkParams } from "@/lib/utils/single-use-surveys";

interface emailVerificationDetails {
  status: "not-verified" | "verified" | "fishy";
  email?: string;
}

/** Verifies the email verification JWT token for link surveys. Returns the verification status and verified email if valid. */
export const getEmailVerificationDetails = async (
  surveyId: string,
  token: string
): Promise<emailVerificationDetails> => {
  if (!token) {
    return { status: "not-verified" };
  } else {
    try {
      const verifiedEmail = verifyTokenForLinkSurvey(token, surveyId);
      if (verifiedEmail) {
        return { status: "verified", email: verifiedEmail };
      } else {
        return { status: "fishy" };
      }
    } catch (error) {
      return { status: "not-verified" };
    }
  }
};

/** Validates and optionally decrypts a single-use survey ID from URL params. Returns the plaintext ID or null if invalid. */
export const checkAndValidateSingleUseId = (
  suid?: string,
  isEncrypted = false,
  surveyId?: string,
  suToken?: string
): string | null => {
  if (!suid?.trim()) return null;

  if (isEncrypted) {
    const validatedSingleUseId = validateSurveySingleUseId(suid);
    if (!validatedSingleUseId) return null;
    return validatedSingleUseId;
  }

  if (!surveyId) return null;

  try {
    return validateSurveySingleUseLinkParams({
      surveyId,
      suId: suid,
      suToken,
      isEncrypted,
      decrypt: (encryptedSingleUseId) => validateSurveySingleUseId(encryptedSingleUseId) ?? "",
    });
  } catch {
    return null;
  }
};
