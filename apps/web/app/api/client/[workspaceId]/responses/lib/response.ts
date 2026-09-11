import "server-only";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import type { TContactAttributes } from "@formbricks/types/contact-attribute";
import type { TResponse } from "@formbricks/types/responses";
import type { TTag } from "@formbricks/types/tags";
import { evaluateResponseQuotas } from "@/modules/ee/quotas/lib/evaluation-service";

type TQuotaEvaluationResponseInput = {
  surveyId: string;
  data: TResponse["data"];
  variables?: TResponse["variables"];
  language?: string;
};

/**
 * Transforms a raw Prisma response into the client-facing TResponse shape,
 * extracting the contact userId and flattening tags.
 */
export const buildClientResponse = (
  responsePrisma: Omit<TResponse, "contact" | "tags"> & { tags: { tag: TTag }[] },
  contact: { id: string; attributes: TContactAttributes } | null
): TResponse => ({
  ...responsePrisma,
  contact: contact
    ? {
        id: contact.id,
        userId: contact.attributes.userId,
      }
    : null,
  tags: responsePrisma.tags.map((tagPrisma: { tag: TTag }) => tagPrisma.tag),
});

/**
 * Creates a response within a Prisma transaction and evaluates response
 * quotas. Allows the caller to supply the inner createResponse function
 * (v1 or v2 specific).
 */
export const createResponseWithQuotaEvaluation = async <TInput extends TQuotaEvaluationResponseInput>(
  responseInput: TInput,
  createResponse: (responseInput: TInput, tx: Prisma.TransactionClient) => Promise<TResponse>
) => {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const response = await createResponse(responseInput, tx);

    const quotaResult = await evaluateResponseQuotas({
      surveyId: responseInput.surveyId,
      responseId: response.id,
      data: responseInput.data,
      variables: responseInput.variables,
      language: responseInput.language,
      responseFinished: response.finished,
      tx,
    });

    return {
      ...response,
      ...(quotaResult.quotaFull && { quotaFull: quotaResult.quotaFull }),
    };
  });
};
