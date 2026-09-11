import { prisma } from "@formbricks/database";
import { logger } from "@formbricks/logger";
import type { TAuditAction, TAuditStatus, TAuditTarget } from "../types/audit-log";
import { UNKNOWN_DATA } from "../types/audit-log";

interface AuditEventBase {
  organizationId: string;
  action: TAuditAction;
  target: TAuditTarget;
  targetId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface AuditEventWithUser extends AuditEventBase {
  userId: string;
}

interface AuditEventWithApiKey extends AuditEventBase {
  apiKeyId: string;
}

type AuditEvent = AuditEventWithUser | AuditEventWithApiKey;

async function createAuditLogEntry(event: AuditEvent, status: TAuditStatus = "success"): Promise<void> {
  const { organizationId, action, target, targetId, description, metadata } = event;

  const data: Record<string, unknown> = {
    organizationId,
    action,
    target,
    targetId: targetId ?? UNKNOWN_DATA,
    description: description ?? null,
    status,
    metadata: metadata ?? undefined,
  };

  if ("userId" in event) {
    data.userId = event.userId;
  } else if ("apiKeyId" in event) {
    data.apiKeyId = event.apiKeyId;
  }

  try {
    await prisma.auditLog.create({ data });
  } catch (error) {
    logger.error(error, "Failed to create audit log entry");
  }
}

export async function queueAuditEvent(request: Request, event: AuditEventBase): Promise<void> {
  const userId = request.headers.get("x-user-id") ?? undefined;
  const apiKeyId = request.headers.get("x-api-key-id") ?? undefined;

  const fullEvent: AuditEvent = userId
    ? { ...event, userId, organizationId: event.organizationId }
    : apiKeyId
      ? { ...event, apiKeyId, organizationId: event.organizationId }
      : { ...event, userId: UNKNOWN_DATA, organizationId: event.organizationId };

  await createAuditLogEntry(fullEvent);
}

export async function queueAuditEventBackground(request: Request, event: AuditEventBase): Promise<void> {
  await queueAuditEvent(request, event);
}

export async function queueAuditEventWithoutRequest(
  event: AuditEvent,
  status: TAuditStatus = "success"
): Promise<void> {
  await createAuditLogEntry(event, status);
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
          action: actionLabel as TAuditAction,
          target: target as TAuditTarget,
          userId,
        });
      }
    } catch (error) {
      logger.error(error, "Audit logging failed for action: " + actionLabel);
    }
    return result;
  };
}
