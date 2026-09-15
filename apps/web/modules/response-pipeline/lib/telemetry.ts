import { logger } from "@formbricks/logger";

/**
 * Telemetry has been permanently disabled in this AGPL fork.
 *
 * The original Formbricks code POSTed usage telemetry to the upstream SaaS
 * for enterprise license validation. This fork eliminates all EE phone-home behavior
 * per the project's Never-Do list (CLAUDE.md).
 *
 * This stub exists to prevent import errors from callers.
 */
export const sendTelemetryEvents = async () => {
  logger.debug("Telemetry disabled in AGPL fork — no-op");
};
