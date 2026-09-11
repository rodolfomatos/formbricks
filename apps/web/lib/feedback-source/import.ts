/**
 * Imports historical Formbricks survey responses into Hub feedback records.
 *
 * Walks through all existing responses for a survey in batches and transforms
 * each one into the Hub's `FeedbackRecord` format using the configured mappings.
 * Used when a user connects a new Formbricks feedback source and wants to
 * backfill existing data.
 */
import "server-only";
import { InvalidInputError } from "@formbricks/types/errors";
import {
  TFeedbackSourceFormbricksMapping,
  TFeedbackSourceWithMappings,
} from "@formbricks/types/feedback-source";
import { TSurvey } from "@formbricks/types/surveys/types";
import { createFeedbackRecordsBatch } from "@/modules/hub";
import { getResponses } from "../response/service";
import { transformResponseToFeedbackRecords } from "./transform";

const IMPORT_BATCH_SIZE = 50;

/** Result of an import operation, tracking how many records succeeded, failed, or were skipped (e.g. duplicates). */
export type TImportResult = { successes: number; failures: number; skipped: number };

const processBatch = async (
  responses: Awaited<ReturnType<typeof getResponses>>,
  survey: TSurvey,
  mappings: TFeedbackSourceFormbricksMapping[],
  tenantId: string
): Promise<TImportResult> => {
  let successes = 0;
  let failures = 0;
  let duplicates = 0;
  const expectedRecords = responses.length * mappings.length;

  const allRecords = responses.flatMap((response) =>
    transformResponseToFeedbackRecords(response, survey, mappings, tenantId)
  );

  if (allRecords.length > 0) {
    const { results } = await createFeedbackRecordsBatch(allRecords);
    successes = results.filter((r) => r.data !== null).length;
    duplicates = results.filter((r) => r.error?.status === 409).length;
    failures = results.filter((r) => r.error !== null && r.error.status !== 409).length;
  }

  const unmappedSkipped = expectedRecords - allRecords.length;
  return { successes, failures, skipped: unmappedSkipped + duplicates };
};

/**
 * Iterates over all responses of a survey in batches and creates Hub feedback records.
 * Stops when fewer records than the batch size are returned (end of data).
 *
 * @param feedbackSource — the Formbricks-survey feedback source with mappings
 * @param survey — the source survey
 * @returns — aggregate import statistics
 */
export const importHistoricalResponses = async (
  feedbackSource: TFeedbackSourceWithMappings,
  survey: TSurvey
): Promise<TImportResult> => {
  if (feedbackSource.type !== "formbricks_survey") {
    throw new InvalidInputError("Historical import is only supported for Formbricks feedbackSources");
  }

  let successes = 0;
  let failures = 0;
  let skipped = 0;
  let offset = 0;

  while (true) {
    const responses = await getResponses(survey.id, IMPORT_BATCH_SIZE, offset);
    if (responses.length === 0) break;

    const batch = await processBatch(
      responses,
      survey,
      feedbackSource.formbricksMappings,
      feedbackSource.feedbackDirectoryId
    );
    successes += batch.successes;
    failures += batch.failures;
    skipped += batch.skipped;

    if (responses.length < IMPORT_BATCH_SIZE) break;
    offset += IMPORT_BATCH_SIZE;
  }

  return { successes, failures, skipped };
};
