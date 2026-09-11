import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { logger } from "@formbricks/logger";
import {
  S3_ACCESS_KEY,
  S3_BUCKET_NAME,
  S3_ENDPOINT_URL,
  S3_FORCE_PATH_STYLE,
  S3_REGION,
  S3_SECRET_KEY,
} from "./constants";
import { type Result, type StorageError, StorageErrorCode, err, ok } from "./types/error";

// Cached singleton instance of S3Client
let cachedS3Client: S3Client | undefined;

/**
 * Builds an S3Client from env vars (S3_REGION, S3_ENDPOINT_URL, S3_ACCESS_KEY,
 * S3_SECRET_KEY). Only S3_BUCKET_NAME is strictly required; missing credentials
 * fall back to the AWS SDK's default credential chain (IAM roles, etc.).
 *
 * @returns — S3Client instance on success, or a StorageError
 */
export const createS3ClientFromEnv = (): Result<S3Client, StorageError> => {
  try {
    // Only S3_BUCKET_NAME is required - S3_REGION is optional and will default to AWS SDK defaults
    if (!S3_BUCKET_NAME) {
      logger.error("S3 Client: S3_BUCKET_NAME is required");
      return err({
        code: StorageErrorCode.S3CredentialsError,
      });
    }

    // Build S3 client configuration
    const s3Config: S3ClientConfig = {
      endpoint: S3_ENDPOINT_URL,
      forcePathStyle: S3_FORCE_PATH_STYLE,
    };

    // Only set region if it's provided, otherwise let AWS SDK use its defaults
    if (S3_REGION) {
      s3Config.region = S3_REGION;
    }

    // Only add credentials if both access key and secret key are provided
    // This allows the AWS SDK to use IAM roles, instance profiles, or other credential providers
    if (S3_ACCESS_KEY && S3_SECRET_KEY) {
      s3Config.credentials = {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      };
    }

    const s3ClientInstance = new S3Client(s3Config);

    return ok(s3ClientInstance);
  } catch (error) {
    logger.error({ error }, "Error creating S3 client from environment variables");
    return err({
      code: StorageErrorCode.Unknown,
    });
  }
};

/**
 * Returns a cached singleton S3 client. Lazily initialises from environment
 * on first call; subsequent calls reuse the same instance.
 */
export const getCachedS3Client = (): S3Client | undefined => {
  if (!cachedS3Client) {
    const result = createS3ClientFromEnv();
    if (result.ok) {
      cachedS3Client = result.data;
    }
  }
  return cachedS3Client;
};

/**
 * Returns the provided S3 client or falls back to the cached singleton.
 * This lets callers inject a custom client (e.g. for testing) while defaulting
 * to the env-based singleton in production.
 *
 * @param s3Client — Optional pre-configured client that takes priority
 * @returns — S3 client instance, or undefined if not configured
 */
export const createS3Client = (s3Client?: S3Client): S3Client | undefined => {
  if (s3Client) {
    return s3Client;
  }
  return getCachedS3Client();
};
