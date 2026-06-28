/**
 * Verifies a Cloudflare Turnstile captcha token against the Cloudflare API.
 * Uses a 5-second timeout (AbortController) to prevent the sign-up flow
 * from hanging if the Cloudflare API is unreachable. Returns false on any
 * error (network, timeout, verification failure) so sign-up never hard-fails
 * on captcha — the caller decides whether to block or proceed.
 *
 * @param secretKey - Turnstile secret key from env config
 * @param token     - Turnstile response token from the client widget
 * @returns true if Cloudflare confirms the token is valid
 */
export const verifyTurnstileToken = async (secretKey: string, token: string): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Verification failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};
