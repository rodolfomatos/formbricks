import { z } from "zod";
import { prisma } from "@formbricks/database";
import { Prisma, Webhook } from "@formbricks/database/prisma";
import { PrismaErrorType } from "@formbricks/database/types/error";
import { Result, err, ok } from "@formbricks/types/error-handlers";
import { InvalidInputError } from "@formbricks/types/errors";
import { validateWebhookUrl } from "@/lib/utils/validate-webhook-url";
import { ZWebhookUpdateSchema } from "@/modules/api/v2/management/webhooks/[webhookId]/types/webhooks";
import { ApiErrorResponseV2 } from "@/modules/api/v2/types/api-error";

type WebhookWithoutSecret = Omit<Webhook, "secret">;

// Safe by default — the signing secret stays in the database.
// Use getWebhookWithSecret only for server-side flows that legitimately need to sign payloads.
/**
 * Retrieves a webhook by ID, omitting the signing secret.
 *
 * @param webhookId — The webhook ID
 * @returns — The webhook without its secret
 */
export const getWebhook = async (
  webhookId: string
): Promise<Result<WebhookWithoutSecret, ApiErrorResponseV2>> => {
  try {
    const webhook = await prisma.webhook.findUnique({
      where: {
        id: webhookId,
      },
      omit: {
        secret: true,
      },
    });

    if (!webhook) {
      return err({
        type: "not_found",
        details: [{ field: "webhook", issue: "not found" }],
      });
    }

    return ok(webhook);
  } catch (error) {
    return err({
      type: "internal_server_error",
      details: [
        { field: "webhook", issue: error instanceof Error ? error.message : "Unknown error occurred" },
      ],
    });
  }
};

// Internal-only — returns the signing secret. Never expose the result through an API response.
/**
 * Retrieves a webhook by ID including the signing secret. Internal use only.
 *
 * @param webhookId — The webhook ID
 * @returns — The full webhook including secret
 */
export const getWebhookWithSecret = async (
  webhookId: string
): Promise<Result<Webhook, ApiErrorResponseV2>> => {
  try {
    const webhook = await prisma.webhook.findUnique({
      where: {
        id: webhookId,
      },
    });

    if (!webhook) {
      return err({
        type: "not_found",
        details: [{ field: "webhook", issue: "not found" }],
      });
    }

    return ok(webhook);
  } catch (error) {
    return err({
      type: "internal_server_error",
      details: [
        { field: "webhook", issue: error instanceof Error ? error.message : "Unknown error occurred" },
      ],
    });
  }
};

/**
 * Updates a webhook's fields by ID. Validates URL if changed. Omits secret from response.
 *
 * @param webhookId — The webhook ID to update
 * @param webhookInput — The fields to update
 * @returns — The updated webhook without its secret
 */
export const updateWebhook = async (
  webhookId: string,
  webhookInput: z.infer<typeof ZWebhookUpdateSchema>
): Promise<Result<WebhookWithoutSecret, ApiErrorResponseV2>> => {
  if (webhookInput.url) {
    try {
      await validateWebhookUrl(webhookInput.url);
    } catch (error) {
      if (error instanceof InvalidInputError) {
        return err({
          type: "bad_request",
          details: [{ field: "url", issue: error.message }],
        });
      }
      return err({
        type: "internal_server_error",
        details: [{ field: "url", issue: "Webhook URL validation failed unexpectedly" }],
      });
    }
  }

  try {
    const updatedWebhook = await prisma.webhook.update({
      where: {
        id: webhookId,
      },
      data: webhookInput,
      omit: {
        secret: true,
      },
    });

    return ok(updatedWebhook);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        error.code === PrismaErrorType.RecordDoesNotExist ||
        error.code === PrismaErrorType.RelatedRecordDoesNotExist
      ) {
        return err({
          type: "not_found",
          details: [{ field: "webhook", issue: "not found" }],
        });
      }
    }
    return err({
      type: "internal_server_error",
      details: [
        { field: "webhook", issue: error instanceof Error ? error.message : "Unknown error occurred" },
      ],
    });
  }
};

/**
 * Deletes a webhook by ID.
 *
 * @param webhookId — The webhook ID to delete
 * @returns — The deleted webhook without its secret
 */
export const deleteWebhook = async (
  webhookId: string
): Promise<Result<WebhookWithoutSecret, ApiErrorResponseV2>> => {
  try {
    const deletedWebhook = await prisma.webhook.delete({
      where: {
        id: webhookId,
      },
      omit: {
        secret: true,
      },
    });

    return ok(deletedWebhook);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        error.code === PrismaErrorType.RecordDoesNotExist ||
        error.code === PrismaErrorType.RelatedRecordDoesNotExist
      ) {
        return err({
          type: "not_found",
          details: [{ field: "webhook", issue: "not found" }],
        });
      }
    }
    return err({
      type: "internal_server_error",
      details: [
        { field: "webhook", issue: error instanceof Error ? error.message : "Unknown error occurred" },
      ],
    });
  }
};
