/**
 * Deterministic SHA-256 hash of an arbitrary string.
 * Used where a repeatable, one-way fingerprint is needed (e.g. anonymising IDs).
 *
 * @param string — the input to hash
 * @returns — hex-encoded SHA-256 digest
 */
import crypto from "crypto";

export const hashString = (string: string) => {
  return crypto.createHash("sha256").update(string).digest("hex");
};
