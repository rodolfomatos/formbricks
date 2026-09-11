import "server-only";
import { createCacheKey } from "@formbricks/cache";
import { logger } from "@formbricks/logger";
import { cache } from "@/lib/cache";
import { getHubClient } from "./hub-client";
import type {
  CreateTaxonomyRunInput,
  CreateTaxonomyRunResponse,
  FeedbackRecordCreateParams,
  FeedbackRecordData,
  FeedbackRecordListParams,
  FeedbackRecordListResponse,
  FeedbackRecordUpdateParams,
  ListTaxonomyRunsResponse,
  RenameTaxonomyNodeInput,
  SemanticSearchInput,
  SemanticSearchResponse,
  TaxonomyFieldsResponse,
  TaxonomyNode,
  TaxonomyNodeRecordsResponse,
  TaxonomyRun,
  TaxonomyScope,
  TaxonomyTreeResponse,
} from "./types";
import {
  type HubError,
  type HubResult,
  NO_CONFIG_ERROR,
  createHubResultFromError,
  getErrorMessage,
  getErrorStatus,
  toQueryString,
} from "./utils";

export type HubFeedbackRecordResult = {
  data: FeedbackRecordData | null;
  error: HubError | null;
};

/**
 * Create a single feedback record in the Hub.
 * Returns a result shape with data or error; logs failures.
 */
/**
 * Create a single feedback record in the Hub.
 *
 * @param input — the feedback record creation params
 * @returns — { data, error } where data is the created record or null
 */
export const createFeedbackRecord = async (
  input: FeedbackRecordCreateParams
): Promise<HubFeedbackRecordResult> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }
  try {
    const data = await client.feedbackRecords.create(input);
    return { data, error: null };
  } catch (err) {
    logger.warn({ err, fieldId: input.field_id }, "Hub: createFeedbackRecord failed");
    return createHubResultFromError(err);
  }
};

/**
 * Retrieve a single feedback record from the Hub by id.
 */
/**
 * Fetch a single feedback record from the Hub by its ID.
 *
 * @param id — the Hub record ID
 * @returns — { data, error }
 */
export const retrieveFeedbackRecord = async (id: string): Promise<HubFeedbackRecordResult> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    const data = await client.feedbackRecords.retrieve(id);
    return { data, error: null };
  } catch (err) {
    logger.warn({ err, id }, "Hub: retrieveFeedbackRecord failed");
    return createHubResultFromError(err);
  }
};

/**
 * Update a single feedback record in the Hub by id.
 */
/**
 * Update a feedback record in the Hub.
 *
 * @param id — the record ID to update
 * @param input — the update payload
 * @returns — { data, error }
 */
export const updateFeedbackRecord = async (
  id: string,
  input: FeedbackRecordUpdateParams
): Promise<HubFeedbackRecordResult> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    const data = await client.feedbackRecords.update(id, input);
    return { data, error: null };
  } catch (err) {
    logger.warn({ err, id }, "Hub: updateFeedbackRecord failed");
    return createHubResultFromError(err);
  }
};

export type HubFeedbackRecordDeleteResult = {
  data: { deleted: true } | null;
  error: HubError | null;
};

/**
 * Delete a single feedback record in the Hub by id.
 */
/**
 * Delete a feedback record from the Hub.
 *
 * @param id — the record ID to delete
 * @returns — { data: { deleted: true }, error } or { data: null, error }
 */
export const deleteFeedbackRecord = async (id: string): Promise<HubFeedbackRecordDeleteResult> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    await client.feedbackRecords.delete(id);
    return { data: { deleted: true }, error: null };
  } catch (err) {
    logger.warn({ err, id }, "Hub: deleteFeedbackRecord failed");
    const status = getErrorStatus(err);
    const message = getErrorMessage(err);
    return { data: null, error: { status, message, detail: message } };
  }
};

export type HubTenantDataDeleteResult = {
  data: {
    deletedFeedbackRecords: number;
    deletedEmbeddings: number;
    deletedWebhooks: number;
  } | null;
  error: HubError | null;
};

type TenantDataDeleteResponse = {
  tenant_id: string;
  deleted_feedback_records: number;
  deleted_embeddings: number;
  deleted_webhooks: number;
  message?: string;
};

/**
 * Purge all Hub-owned data (feedback records, derived embeddings, webhooks) for a tenant.
 * Called when the owning organization is deleted so Hub-side rows don't become orphaned.
 * Idempotent on the Hub side; the caller treats failures as best-effort.
 *
 * Hits `DELETE /v1/tenants/{tenant_id}/data` directly because the SDK doesn't yet expose
 * a typed method for this endpoint.
 */
/**
 * Purge all Hub-side data (records, embeddings, webhooks) for a tenant.
 * Called when the owning organisation is deleted.
 *
 * @param tenantId — the Hub tenant ID
 * @returns — counts of deleted items or error
 */
export const deleteHubTenantData = async (tenantId: string): Promise<HubTenantDataDeleteResult> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    const data = await client.delete<TenantDataDeleteResponse>(
      `/v1/tenants/${encodeURIComponent(tenantId)}/data`
    );
    return {
      data: {
        deletedFeedbackRecords: data.deleted_feedback_records,
        deletedEmbeddings: data.deleted_embeddings,
        deletedWebhooks: data.deleted_webhooks,
      },
      error: null,
    };
  } catch (err) {
    logger.warn({ err, tenantId }, "Hub: deleteHubTenantData failed");
    const status = getErrorStatus(err);
    const message = getErrorMessage(err);
    return { data: null, error: { status, message, detail: message } };
  }
};

export type ListFeedbackRecordsResult = {
  data: FeedbackRecordListResponse | null;
  error: HubError | null;
};

export type SemanticSearchFeedbackRecordsResult = {
  data: SemanticSearchResponse | null;
  error: HubError | null;
};

export type FeedbackRecordTenantResult = {
  data: { tenantId: string } | null;
  error: { status: number; message: string; detail: string } | null;
};

/**
 * List feedback records from the Hub with optional filters and pagination.
 */
/**
 * List feedback records with optional filters and pagination.
 *
 * @param params — list parameters (filters, pagination)
 * @returns — { data: FeedbackRecordListResponse, error } or { data: null, error }
 */
export const listFeedbackRecords = async (
  params: FeedbackRecordListParams
): Promise<ListFeedbackRecordsResult> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }
  try {
    const data = await client.feedbackRecords.list(params);
    return { data, error: null };
  } catch (err) {
    logger.warn({ err }, "Hub: listFeedbackRecords failed");
    const status = getErrorStatus(err);
    const message = getErrorMessage(err);
    return { data: null, error: { status, message, detail: message } };
  }
};

/**
 * Perform a semantic search across feedback records.
 *
 * @param input — search query and tenant scope
 * @returns — { data: SemanticSearchResponse, error } or { data: null, error }
 */
export const semanticSearchFeedbackRecords = async (
  input: SemanticSearchInput
): Promise<SemanticSearchFeedbackRecordsResult> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }
  try {
    const data = await client.feedbackRecords.search.performSemanticSearch(input);
    return { data, error: null };
  } catch (err) {
    logger.warn({ err, tenantId: input.tenant_id }, "Hub: semanticSearchFeedbackRecords failed");
    const status = getErrorStatus(err);
    const message = getErrorMessage(err);
    return { data: null, error: { status, message, detail: message } };
  }
};

/**
 * Look up the tenant ID that owns a given feedback record. Uses a
 * 60-second Redis cache to avoid redundant Hub API calls.
 *
 * @param recordId — the Hub record ID
 * @returns — { data: { tenantId } } or { error }
 */
export const getFeedbackRecordTenant = async (recordId: string): Promise<FeedbackRecordTenantResult> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    const data = await cache.withCache(
      async () => {
        const feedbackRecord = await client.feedbackRecords.retrieve(recordId);
        return { tenantId: feedbackRecord.tenant_id };
      },
      createCacheKey.hub.feedbackRecordTenant(recordId),
      60_000
    );

    return { data, error: null };
  } catch (err) {
    logger.warn({ err, recordId }, "Hub: getFeedbackRecordTenant failed");
    const status = getErrorStatus(err);
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: { status, message, detail: message } };
  }
};

/**
 * Create multiple feedback records in the Hub in parallel.
 * Returns an array of results (data or error) per input; logs failures.
 */
/**
 * Create multiple feedback records in parallel.
 *
 * @param inputs — array of creation params
 * @returns — { results } where each entry is { data, error }
 */
export const createFeedbackRecordsBatch = async (
  inputs: FeedbackRecordCreateParams[]
): Promise<{ results: HubFeedbackRecordResult[] }> => {
  const client = getHubClient();
  if (!client) {
    return {
      results: inputs.map(() => ({ data: null, error: { ...NO_CONFIG_ERROR } })),
    };
  }

  const results = await Promise.all(
    inputs.map(async (input) => {
      try {
        const data = await client.feedbackRecords.create(input);
        return { data, error: null as HubFeedbackRecordResult["error"] };
      } catch (err) {
        logger.warn({ err, fieldId: input.field_id }, "Hub: createFeedbackRecord failed");
        return createHubResultFromError<FeedbackRecordData>(err);
      }
    })
  );
  return { results };
};

/**
 * List available taxonomy fields for a tenant.
 */
export const listTaxonomyFields = async (tenantId: string): Promise<HubResult<TaxonomyFieldsResponse>> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    const data = await client.get<TaxonomyFieldsResponse>(
      `/v1/taxonomy/fields${toQueryString({ tenant_id: tenantId })}`
    );
    return { data, error: null };
  } catch (err) {
    logger.warn({ err, tenantId }, "Hub: listTaxonomyFields failed");
    return createHubResultFromError(err);
  }
};

/**
 * Kick off a new taxonomy classification run.
 */
export const createTaxonomyRun = async (
  input: CreateTaxonomyRunInput
): Promise<HubResult<CreateTaxonomyRunResponse>> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    const data = await client.post<CreateTaxonomyRunResponse>("/v1/taxonomy/runs", { body: input });
    return { data, error: null };
  } catch (err) {
    logger.warn(
      {
        err,
        tenantId: input.tenant_id,
        sourceType: input.source_type,
        sourceId: input.source_id,
        fieldId: input.field_id,
      },
      "Hub: createTaxonomyRun failed"
    );
    return createHubResultFromError(err);
  }
};

/**
 * List taxonomy runs scoped to a tenant + source + field.
 */
export const listTaxonomyRuns = async (
  params: TaxonomyScope & { limit?: number }
): Promise<HubResult<ListTaxonomyRunsResponse>> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    const data = await client.get<ListTaxonomyRunsResponse>(`/v1/taxonomy/runs${toQueryString(params)}`);
    return { data, error: null };
  } catch (err) {
    logger.warn({ err, tenantId: params.tenant_id }, "Hub: listTaxonomyRuns failed");
    return createHubResultFromError(err);
  }
};

/**
 * Fetch a single taxonomy run by ID.
 */
export const getTaxonomyRun = async (runId: string, tenantId: string): Promise<HubResult<TaxonomyRun>> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    const data = await client.get<TaxonomyRun>(
      `/v1/taxonomy/runs/${encodeURIComponent(runId)}${toQueryString({ tenant_id: tenantId })}`
    );
    return { data, error: null };
  } catch (err) {
    logger.warn({ err, runId, tenantId }, "Hub: getTaxonomyRun failed");
    return createHubResultFromError(err);
  }
};

/**
 * Get the taxonomy tree from the most recent active (successful) run.
 */
export const getActiveTaxonomyTree = async (
  scope: TaxonomyScope
): Promise<HubResult<TaxonomyTreeResponse>> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    const data = await client.get<TaxonomyTreeResponse>(
      `/v1/taxonomy/runs/active/tree${toQueryString(scope)}`
    );
    return { data, error: null };
  } catch (err) {
    logger.warn({ err, tenantId: scope.tenant_id }, "Hub: getActiveTaxonomyTree failed");
    return createHubResultFromError(err);
  }
};

/**
 * Get the taxonomy tree for a specific run.
 */
export const getTaxonomyTree = async (
  runId: string,
  tenantId: string
): Promise<HubResult<TaxonomyTreeResponse>> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    const data = await client.get<TaxonomyTreeResponse>(
      `/v1/taxonomy/runs/${encodeURIComponent(runId)}/tree${toQueryString({ tenant_id: tenantId })}`
    );
    return { data, error: null };
  } catch (err) {
    logger.warn({ err, runId, tenantId }, "Hub: getTaxonomyTree failed");
    return createHubResultFromError(err);
  }
};

/**
 * Rename a taxonomy node.
 */
export const renameTaxonomyNode = async (
  nodeId: string,
  input: RenameTaxonomyNodeInput
): Promise<HubResult<TaxonomyNode>> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    const data = await client.patch<TaxonomyNode>(`/v1/taxonomy/nodes/${encodeURIComponent(nodeId)}`, {
      body: input,
    });
    return { data, error: null };
  } catch (err) {
    logger.warn({ err, nodeId, tenantId: input.tenant_id }, "Hub: renameTaxonomyNode failed");
    return createHubResultFromError(err);
  }
};

/**
 * Remove (soft-delete) a taxonomy node.
 */
export const removeTaxonomyNode = async (
  nodeId: string,
  params: { tenant_id: string; actor_id: string }
): Promise<HubResult<TaxonomyNode>> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    const data = await client.delete<TaxonomyNode>(
      `/v1/taxonomy/nodes/${encodeURIComponent(nodeId)}${toQueryString(params)}`
    );
    return { data, error: null };
  } catch (err) {
    logger.warn({ err, nodeId, tenantId: params.tenant_id }, "Hub: removeTaxonomyNode failed");
    return createHubResultFromError(err);
  }
};

/**
 * List feedback records assigned to a specific taxonomy node.
 */
export const listTaxonomyNodeRecords = async (
  nodeId: string,
  params: { tenant_id: string; limit?: number }
): Promise<HubResult<TaxonomyNodeRecordsResponse>> => {
  const client = getHubClient();
  if (!client) {
    return { data: null, error: { ...NO_CONFIG_ERROR } };
  }

  try {
    const data = await client.get<TaxonomyNodeRecordsResponse>(
      `/v1/taxonomy/nodes/${encodeURIComponent(nodeId)}/records${toQueryString(params)}`
    );
    return { data, error: null };
  } catch (err) {
    logger.warn({ err, nodeId, tenantId: params.tenant_id }, "Hub: listTaxonomyNodeRecords failed");
    return createHubResultFromError(err);
  }
};
