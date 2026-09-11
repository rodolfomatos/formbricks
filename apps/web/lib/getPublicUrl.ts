import "server-only";
import { env } from "./env";

const configuredWebappUrl = env.WEBAPP_URL?.trim() ?? "";
const WEBAPP_URL = configuredWebappUrl === "" ? "http://localhost:3000" : configuredWebappUrl;

/**
 * Resolves the publicly-accessible domain for the current instance.
 * PUBLIC_URL is preferred when set (e.g. behind a reverse proxy); otherwise falls
 * back to WEBAPP_URL so that links in emails, webhooks, and integrations always
 * point to the correct origin.
 *
 * @returns — the public origin string (no trailing slash)
 */
export const getPublicDomain = (): string => {
  return env.PUBLIC_URL && env.PUBLIC_URL.trim() !== "" ? env.PUBLIC_URL : WEBAPP_URL;
};
