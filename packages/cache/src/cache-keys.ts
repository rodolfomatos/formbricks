import { type CacheKey, type CustomCacheNamespace } from "@/types/keys";
import { makeCacheKey } from "./utils/key";

/**
 * Pre-defined, namespaced cache key factory — every key follows the pattern
 * `fb:{resource}:{identifier}:{subResource}` so that operations teams can
 * inspect Redis with predictable patterns and invalidation is straightforward.
 *
 * Benefits:
 * - Collision-proof across tenants and resources
 * - Predictable, debuggable key structure
 * - Type-safe output (branded CacheKey)
 */

export const createCacheKey = {
  workspace: {
    state: (workspaceId: string): CacheKey => makeCacheKey("env", workspaceId, "state"),
    config: (workspaceId: string): CacheKey => makeCacheKey("env", workspaceId, "config"),
    segments: (workspaceId: string): CacheKey => makeCacheKey("env", workspaceId, "segments"),
  },

  organization: {
    billing: (organizationId: string): CacheKey => makeCacheKey("org", organizationId, "billing"),
  },

  license: {
    status: (organizationId: string): CacheKey => makeCacheKey("license", organizationId, "status"),
    previous_result: (organizationId: string): CacheKey =>
      makeCacheKey("license", organizationId, "previous_result"),
    fetch_lock: (organizationId: string): CacheKey => makeCacheKey("license", organizationId, "fetch_lock"),
  },

  response: {
    countBySurveyId: (surveyId: string): CacheKey => makeCacheKey("response", surveyId, "count"),
  },

  hub: {
    feedbackRecordTenant: (recordId: string): CacheKey =>
      makeCacheKey("hub", recordId, "feedback_record_tenant"),
  },

  rateLimit: {
    core: (namespace: string, identifier: string, windowStart: number): CacheKey =>
      makeCacheKey("rate_limit", namespace, identifier, String(windowStart)),
  },

  custom: (namespace: CustomCacheNamespace, identifier: string, subResource?: string): CacheKey => {
    return subResource !== undefined
      ? makeCacheKey(namespace, identifier, subResource)
      : makeCacheKey(namespace, identifier);
  },
};
