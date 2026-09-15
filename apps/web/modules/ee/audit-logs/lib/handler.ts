import { prisma } from "@formbricks/database";
import { logger } from "@formbricks/logger";
import type { TAuditStatus } from "../types/audit-log";
import { UNKNOWN_DATA } from "../types/audit-log";

export type TAuditEventInput = {
  action: string;
  targetType: string;
  userId?: string;
  userType?: "user" | "api" | "system";
  targetId?: string;
  organizationId: string;
  status?: TAuditStatus;
  oldObject?: Record<string, unknown>;
  newObject?: Record<string, unknown>;
  eventId?: string;
  apiUrl?: string;
};

async function createAuditLogEntry(event: TAuditEventInput): Promise<void> {
  const { action, targetType, userId, userType, targetId, organizationId, status, oldObject, newObject } =
    event;

  const data: Record<string, unknown> = {
    organizationId,
    action,
    target: targetType,
    targetId: targetId ?? UNKNOWN_DATA,
    description: oldObject || newObject ? JSON.stringify({ oldObject, newObject }) : null,
    status: status ?? "success",
    metadata: event.eventId || event.apiUrl ? { eventId: event.eventId, apiUrl: event.apiUrl } : undefined,
  };

  if (userType === "api" && userId) {
    data.apiKeyId = userId;
  } else if (userId) {
    data.userId = userId;
  }

  try {
    await prisma.auditLog.create({ data });
  } catch (error) {
    logger.error(error, "Failed to create audit log entry");
  }
}

export async function queueAuditEvent(event: TAuditEventInput): Promise<void> {
  await createAuditLogEntry(event);
}

export async function queueAuditEventBackground(event: TAuditEventInput): Promise<void> {
  await queueAuditEvent(event);
}

export async function queueAuditEventWithoutRequest(
  event: TAuditEventInput,
  status?: TAuditStatus
): Promise<void> {
  await createAuditLogEntry({ ...event, status: status ?? event.status });
}

export function withAuditLogging<TArgs extends unknown[], TResult>(
  actionLabel: string,
  target: string,
  fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const result = await fn(...args);
    try {
      const input = args[0] as Record<string, unknown> | undefined;
      const ctx = input?.ctx as Record<string, unknown> | undefined;
      const auditCtx = ctx?.auditLoggingCtx as Record<string, unknown> | undefined;
      const organizationId = auditCtx?.organizationId as string | undefined;
      if (organizationId) {
        const userId = (auditCtx?.userId as string) ?? UNKNOWN_DATA;
        await createAuditLogEntry({
          organizationId,
          action: actionLabel,
          targetType: target,
          userType: "user",
          userId,
        });
      }
    } catch (error) {
      logger.error(error, "Audit logging failed for action: " + actionLabel);
    }
    return result;
  };
}
