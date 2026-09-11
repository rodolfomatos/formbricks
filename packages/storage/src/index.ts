/**
 * Storage module — S3-based file storage with signed URLs for upload/download,
 * streaming, and bulk deletion by prefix.
 *
 * @example
 * ```typescript
 * import { getSignedUploadUrl, deleteFile } from "@formbricks/storage";
 * ```
 */
export {
  deleteFile,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  deleteFilesByPrefix,
  getFileStream,
} from "./service";
export type { FileStreamResult } from "./service";
export { StorageErrorCode } from "./types/error";
export type { StorageError } from "./types/error";
