import { compare, hash } from "bcryptjs";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { logger } from "@formbricks/logger";
import { ENCRYPTION_KEY } from "@/lib/constants";

const ALGORITHM_V1 = "aes256";
const ALGORITHM_V2 = "aes-256-gcm";
const INPUT_ENCODING = "utf8";
const OUTPUT_ENCODING = "hex";
const BUFFER_ENCODING = ENCRYPTION_KEY.length === 32 ? "latin1" : "hex";
const IV_LENGTH = 16; // AES blocksize

/**
 * AES-256-GCM symmetric encryption of a plaintext string.
 * Produces a colon-delimited "iv:ciphertext:authTag" payload that carries
 * everything needed for decryption. Used wherever we need to protect sensitive
 * data at rest (tokens, credentials).
 *
 * @param text — plaintext to encrypt
 * @param key — secret key (must be 32 bytes)
 *
 * @returns — "iv:encrypted:authTag" hex-encoded string
 */
export const symmetricEncrypt = (text: string, key: string) => {
  const _key = Buffer.from(key, BUFFER_ENCODING);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM_V2, _key, iv);
  let ciphered = cipher.update(text, INPUT_ENCODING, OUTPUT_ENCODING);
  ciphered += cipher.final(OUTPUT_ENCODING);
  const tag = cipher.getAuthTag().toString(OUTPUT_ENCODING);
  return `${iv.toString(OUTPUT_ENCODING)}:${ciphered}:${tag}`;
};

/**
 *
 * @param text Value to decrypt
 * @param key Key used to decrypt value must be 32 bytes for AES256 encryption algorithm
 */

const symmetricDecryptV1 = (text: string, key: string): string => {
  const _key = Buffer.from(key, BUFFER_ENCODING);

  const components = text.split(":");
  const iv_from_ciphertext = Buffer.from(components.shift() ?? "", OUTPUT_ENCODING);
  const decipher = createDecipheriv(ALGORITHM_V1, _key, iv_from_ciphertext);
  let deciphered = decipher.update(components.join(":"), OUTPUT_ENCODING, INPUT_ENCODING);
  deciphered += decipher.final(INPUT_ENCODING);

  return deciphered;
};

/**
 *
 * @param text Value to decrypt
 * @param key Key used to decrypt value must be 32 bytes for AES256 encryption algorithm
 */

const symmetricDecryptV2 = (text: string, key: string): string => {
  // split into [ivHex, encryptedHex, tagHex]
  const [ivHex, encryptedHex, tagHex] = text.split(":");
  const _key = Buffer.from(key, BUFFER_ENCODING);
  const iv = Buffer.from(ivHex, OUTPUT_ENCODING);
  const decipher = createDecipheriv(ALGORITHM_V2, _key, iv);
  decipher.setAuthTag(Buffer.from(tagHex, OUTPUT_ENCODING));
  let decrypted = decipher.update(encryptedHex, OUTPUT_ENCODING, INPUT_ENCODING);
  decrypted += decipher.final(INPUT_ENCODING);
  return decrypted;
};

/**
 * Decrypts an encrypted payload, automatically handling multiple encryption versions.
 *
 * If the payload contains exactly one “:”, it is treated as a legacy V1 format
 * and `symmetricDecryptV1` is invoked. Otherwise, it attempts a V2 GCM decryption
 * via `symmetricDecryptV2`, falling back to V1 on failure (e.g., authentication
 * errors or bad formats).
 *
 * @param payload - The encrypted string to decrypt.
 * @param key - The secret key used for decryption.
 * @returns The decrypted plaintext.
 */

/**
 * Decrypts an encrypted payload, automatically detecting the encryption version.
 * Supports V1 (legacy CBC — single colon) and V2 (GCM — two colons) formats
 * so that secrets encrypted under the old scheme remain readable after upgrade.
 *
 * @param payload — "iv:encrypted[:tag]" string from `symmetricEncrypt`
 * @param key — the secret key used during encryption
 * @returns — decrypted plaintext
 */
export function symmetricDecrypt(payload: string, key: string): string {
  // If it's clearly V1 (only one “:”), skip straight to V1
  if (payload.split(":").length === 2) {
    return symmetricDecryptV1(payload, key);
  }

  // Otherwise try GCM first, then fall back to CBC
  try {
    return symmetricDecryptV2(payload, key);
  } catch (err) {
    logger.warn({ err }, "AES-GCM decryption failed; refusing to fall back to insecure CBC");

    throw err;
  }
}

/**
 * One-way bcrypt hash for secrets (passwords, API keys).
 * Chosen over SHA-2 because bcrypt includes a salt and adaptive cost factor.
 *
 * @param secret — the raw secret to hash
 * @param cost — bcrypt cost factor (default 12)
 * @returns — "$2b$..." hash string
 */
export const hashSecret = async (secret: string, cost: number = 12): Promise<string> => {
  return await hash(secret, cost);
};

/**
 * Constant-time comparison of a raw secret against a bcrypt hash.
 * Returns `false` (instead of throwing) on malformed hashes so callers
 * don't accidentally leak information through error paths.
 *
 * @param secret — the raw secret to verify
 * @param hashedSecret — bcrypt hash to compare against
 * @returns — true if the secret matches, false otherwise
 */
export const verifySecret = async (secret: string, hashedSecret: string): Promise<boolean> => {
  try {
    const isValid = await compare(secret, hashedSecret);
    return isValid;
  } catch (error) {
    // Log warning for debugging purposes, but don't throw to maintain security
    logger.warn({ error }, "Secret verification failed due to invalid hash format");
    // Return false for invalid hashes or other bcrypt errors
    return false;
  }
};

/**
 * Deterministic SHA-256 hash (no salt, no cost factor).
 * Used only for backward-compatible scenarios where the caller needs a
 * repeatable digest (e.g. legacy API key derivation). Do NOT use for passwords.
 *
 * @param input — the string to hash
 * @returns — hex-encoded SHA-256 digest
 */
export const hashSha256 = (input: string): string => {
  return createHash("sha256").update(input).digest("hex");
};

/**
 * Parses an API key in the v2 "fbk_{secret}" format.
 * Validates the prefix and character set to reject malformed keys early
 * without making a database round-trip.
 *
 * @param key — the raw key string
 * @returns — the extracted secret, or null if the format is invalid
 */
export const parseApiKeyV2 = (key: string): { secret: string } | null => {
  // Check if it starts with fbk_
  if (!key.startsWith("fbk_")) {
    return null;
  }

  const secret = key.slice(4); // Skip 'fbk_' prefix

  // Validate that secret contains only allowed characters and is not empty
  // Secrets are base64url-encoded and can contain underscores, hyphens, and alphanumeric chars
  if (!secret || !/^[A-Za-z0-9_-]+$/.test(secret)) {
    return null;
  }

  return { secret };
};

// Standard Webhooks secret prefix
const WEBHOOK_SECRET_PREFIX = "whsec_";

/**
 * Generates a Standard Webhooks-compliant shared secret.
 * Produces 256 bits of entropy encoded as "whsec_{base64}" so webhook
 * receivers can verify authenticity using the standard HMAC-SHA256 scheme.
 *
 * @returns — "whsec_{base64}" secret string
 */
export const generateWebhookSecret = (): string => {
  const secretBytes = randomBytes(32); // 256 bits of entropy
  return `${WEBHOOK_SECRET_PREFIX}${secretBytes.toString("base64")}`;
};

/**
 * Decodes a Standard Webhooks secret back to raw bytes for HMAC computation.
 * Accepts the secret with or without the "whsec_" prefix.
 *
 * @param secret — the webhook secret string
 * @returns — Buffer with the decoded secret bytes
 */
export const getWebhookSecretBytes = (secret: string): Buffer => {
  const base64Part = secret.startsWith(WEBHOOK_SECRET_PREFIX)
    ? secret.slice(WEBHOOK_SECRET_PREFIX.length)
    : secret;
  return Buffer.from(base64Part, "base64");
};

/**
 * Computes the HMAC-SHA256 signature required by the Standard Webhooks spec.
 * The signed content is "{id}.{timestamp}.{payload}" — the receiver recomputes
 * this and compares it to the `webhook-signature` header.
 *
 * @param webhookId — unique message identifier from the webhook event
 * @param timestamp — Unix timestamp (seconds) of the event
 * @param payload — serialised request body
 * @param secret — the shared secret (whsec_ prefix is stripped internally)
 * @returns — "v1,{base64_signature}" header value
 */
export const generateStandardWebhookSignature = (
  webhookId: string,
  timestamp: number,
  payload: string,
  secret: string
): string => {
  const signedContent = `${webhookId}.${timestamp}.${payload}`;
  const secretBytes = getWebhookSecretBytes(secret);
  const signature = createHmac("sha256", secretBytes).update(signedContent).digest("base64");
  return `v1,${signature}`;
};
