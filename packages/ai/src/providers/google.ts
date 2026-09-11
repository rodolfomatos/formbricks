import { createVertex as createGoogleCloudProvider } from "@ai-sdk/google-vertex";
import { AIConfigurationError } from "../errors";
import type { AIProviderAdapter } from "../registry";
import { getCredentialFingerprint, normalizeValue } from "../shared";
import type { AIEnvironment } from "../types";

/**
 * Internal type for the Google Vertex AI SDK settings.
 */
type GoogleProviderSettings = NonNullable<Parameters<typeof createGoogleCloudProvider>[0]>;

/**
 * The API version used for multi-region base URL construction.
 */
const GOOGLE_VERTEX_MULTI_REGION_API_VERSION = "v1";
/**
 * Maps location shorthand to the Google Vertex multi-region endpoint host.
 */
const GOOGLE_VERTEX_MULTI_REGION_HOSTS: Partial<Record<string, string>> = {
  eu: "https://aiplatform.eu.rep.googleapis.com",
  us: "https://aiplatform.us.rep.googleapis.com",
};

/**
 * Type guard: checks that the unknown value is a plain (non-array) object.
 */
const isCredentialsObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Builds a multi-region base URL for Google Vertex when the location is a
 * recognised multi-region (e.g. "eu" or "us"), otherwise returns undefined
 * so the SDK falls back to the default per-location endpoint.
 */
const getGoogleVertexMultiRegionBaseURL = (project?: string, location?: string): string | undefined => {
  if (!project || !location) {
    return undefined;
  }

  const multiRegionHost = GOOGLE_VERTEX_MULTI_REGION_HOSTS[location];

  if (!multiRegionHost) {
    return undefined;
  }

  return `${multiRegionHost}/${GOOGLE_VERTEX_MULTI_REGION_API_VERSION}/projects/${project}/locations/${location}/publishers/google`;
};

/**
 * Parses the AI_GOOGLE_CLOUD_CREDENTIALS_JSON env var into a credentials
 * object for the Vertex AI SDK.
 *
 * @throws — If the value is not a valid JSON object
 */
const parseGoogleCredentialsJson = (value?: string | null): Record<string, unknown> | undefined => {
  const normalizedValue = normalizeValue(value);

  if (!normalizedValue) {
    return undefined;
  }

  const parsedValue = JSON.parse(normalizedValue) as unknown;

  if (!isCredentialsObject(parsedValue)) {
    throw new Error("AI_GOOGLE_CLOUD_CREDENTIALS_JSON must be a JSON object");
  }

  return parsedValue;
};

/**
 * Google Vertex AI provider adapter. Requires AI_GOOGLE_CLOUD_PROJECT and
 * AI_GOOGLE_CLOUD_LOCATION. Supports both inline credentials JSON and
 * application-default credential file path.
 */
export const googleProviderAdapter: AIProviderAdapter = {
  validate: (environment: AIEnvironment) => {
    const missingFields: string[] = [];
    const invalidFields: string[] = [];

    if (!normalizeValue(environment.AI_GOOGLE_CLOUD_PROJECT)) {
      missingFields.push("AI_GOOGLE_CLOUD_PROJECT");
    }

    if (!normalizeValue(environment.AI_GOOGLE_CLOUD_LOCATION)) {
      missingFields.push("AI_GOOGLE_CLOUD_LOCATION");
    }

    const credentialsJson = normalizeValue(environment.AI_GOOGLE_CLOUD_CREDENTIALS_JSON);

    if (credentialsJson) {
      try {
        parseGoogleCredentialsJson(credentialsJson);
      } catch {
        invalidFields.push("AI_GOOGLE_CLOUD_CREDENTIALS_JSON");
      }
    }

    return {
      missingFields,
      invalidFields,
    };
  },
  buildCacheKey: (model: string, environment: AIEnvironment) =>
    JSON.stringify({
      provider: "google",
      model,
      project: normalizeValue(environment.AI_GOOGLE_CLOUD_PROJECT),
      location: normalizeValue(environment.AI_GOOGLE_CLOUD_LOCATION),
      baseURL: getGoogleVertexMultiRegionBaseURL(
        normalizeValue(environment.AI_GOOGLE_CLOUD_PROJECT),
        normalizeValue(environment.AI_GOOGLE_CLOUD_LOCATION)
      ),
      credentialsJsonFingerprint: getCredentialFingerprint(environment.AI_GOOGLE_CLOUD_CREDENTIALS_JSON),
      applicationCredentialsFingerprint: getCredentialFingerprint(
        environment.AI_GOOGLE_CLOUD_APPLICATION_CREDENTIALS
      ),
    }),
  createModel: (model: string, environment: AIEnvironment) => {
    const project = normalizeValue(environment.AI_GOOGLE_CLOUD_PROJECT);
    const location = normalizeValue(environment.AI_GOOGLE_CLOUD_LOCATION);
    const credentialsJson = normalizeValue(environment.AI_GOOGLE_CLOUD_CREDENTIALS_JSON);
    const applicationCredentials = normalizeValue(environment.AI_GOOGLE_CLOUD_APPLICATION_CREDENTIALS);
    const baseURL = getGoogleVertexMultiRegionBaseURL(project, location);

    if (!project || !location) {
      throw new AIConfigurationError("providerNotConfigured", "Google Cloud AI configuration is incomplete", {
        provider: "google",
        missingFields: [
          ...(!project ? ["AI_GOOGLE_CLOUD_PROJECT"] : []),
          ...(!location ? ["AI_GOOGLE_CLOUD_LOCATION"] : []),
        ],
      });
    }

    let googleAuthOptions: GoogleProviderSettings["googleAuthOptions"] | undefined;

    if (credentialsJson) {
      try {
        googleAuthOptions = {
          credentials: parseGoogleCredentialsJson(credentialsJson),
        } as GoogleProviderSettings["googleAuthOptions"];
      } catch {
        throw new AIConfigurationError(
          "providerNotConfigured",
          "AI_GOOGLE_CLOUD_CREDENTIALS_JSON must be a valid JSON object",
          {
            provider: "google",
            invalidFields: ["AI_GOOGLE_CLOUD_CREDENTIALS_JSON"],
          }
        );
      }
    } else if (applicationCredentials) {
      googleAuthOptions = {
        keyFilename: applicationCredentials,
      } as GoogleProviderSettings["googleAuthOptions"];
    }

    const googleCloudProvider = createGoogleCloudProvider({
      project,
      location,
      ...(baseURL ? { baseURL } : {}),
      ...(googleAuthOptions ? { googleAuthOptions } : {}),
    });

    return googleCloudProvider(model);
  },
};
