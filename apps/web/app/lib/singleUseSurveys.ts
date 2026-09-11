import { createId, isCuid } from "@paralleldrive/cuid2";
import { ENCRYPTION_KEY } from "@/lib/constants";
import { symmetricDecrypt, symmetricEncrypt } from "@/lib/crypto";

/**
 * Generates a single-use ID for a survey. If encryption is enabled, the ID is
 * symmetrically encrypted before being returned.
 */
export const generateSurveySingleUseId = (isEncrypted: boolean): string => {
  const cuid = createId();
  if (!isEncrypted) {
    return cuid;
  }

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const encryptedCuid = symmetricEncrypt(cuid, ENCRYPTION_KEY);
  return encryptedCuid;
};

/**
 * Validates and decrypts a survey single-use ID. Returns the decrypted CUID if
 * valid, or undefined if decryption fails or the decoded value is not a valid CUID.
 */
export const validateSurveySingleUseId = (surveySingleUseId: string): string | undefined => {
  let decryptedCuid: string | null = null;

  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set");
  }
  try {
    decryptedCuid = symmetricDecrypt(surveySingleUseId, ENCRYPTION_KEY);
  } catch (error) {
    return undefined;
  }

  if (isCuid(decryptedCuid)) {
    return decryptedCuid;
  } else {
    return undefined;
  }
};
