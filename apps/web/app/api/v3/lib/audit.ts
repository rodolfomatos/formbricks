import { logger } from "@formbricks/logger";
import { buildAuditLogBaseObject } from "@/app/lib/api/with-api-logging";
import { queueAuditEvent } from "@/modules/ee/audit-logs/lib/handler";
import { TAuditAction, TAuditTarget } from "@/modules/ee/audit-logs/types/audit-log";
import type { TV3AuditLog, TV3Authentication } from "./types";

/**
 * Builds an audit log object for v3 API calls, populating the user/api key
 * identity from the authentication result.
 */
export function buildV3AuditLog(
  authentication: TV3Authentication,
  action?: TAuditAction,
  targetType?: TAuditTarget,
  apiUrl?: string
): TV3AuditLog | undefined {
  if (!authentication || !action || !targetType || !apiUrl) {
    return undefined;
  }

  const auditLog = buildAuditLogBaseObject(action, targetType, apiUrl);

  if ("user" in authentication && authentication.user?.id) {
    auditLog.userId = authentication.user.id;
    auditLog.userType = "user";
  } else if ("apiKeyId" in authentication) {
    auditLog.userId = authentication.apiKeyId;
    auditLog.userType = "api";
    auditLog.organizationId = authentication.organizationId;
  }

  return auditLog;
}

/**
 * Queues a v3 audit event, swallowing errors so audit failures never
 * affect the API response.
 */
export async function queueV3AuditLog(
  auditLog: TV3AuditLog | undefined,
  requestId: string,
  log: ReturnType<typeof logger.withContext>
): Promise<void> {
  if (!auditLog) {
    return;
  }

  try {
    await queueAuditEvent({
      ...auditLog,
      ...(auditLog.status === "failure" ? { eventId: auditLog.eventId ?? requestId } : {}),
    });
  } catch (error) {
    log.error({ error }, "Failed to queue V3 audit event");
  }
}
