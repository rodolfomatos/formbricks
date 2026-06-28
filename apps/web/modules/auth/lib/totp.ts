import { Authenticator } from "@otplib/core";
import type { AuthenticatorOptions } from "@otplib/core/authenticator";
import { createDigest, createRandomBytes } from "@otplib/plugin-crypto";
import { keyDecoder, keyEncoder } from "@otplib/plugin-thirty-two";

/**
 * Validates a TOTP (time-based one-time password) token against a
 * base32-encoded shared secret. Defaults to a verification window of
 * `[1, 0]` (one past interval + current interval) to tolerate slight
 * clock drift between the authenticator app and the server.
 *
 * Creates a fresh Authenticator instance on every call rather than
 * reusing one, because the secret and options may differ per user.
 *
 * @param token  - The TOTP code from the authenticator app (6 digits)
 * @param secret - The base32-encoded shared secret for this user
 * @param opts   - Optional overrides (e.g. custom window, step seconds)
 * @returns true if the token is valid within the configured window
 */
export const totpAuthenticatorCheck = (
  token: string,
  secret: string,
  opts: Partial<AuthenticatorOptions> = {}
) => {
  const { window = [1, 0], ...rest } = opts;
  const authenticator = new Authenticator({
    createDigest,
    createRandomBytes,
    keyDecoder,
    keyEncoder,
    window,
    ...rest,
  });
  return authenticator.check(token, secret);
};
