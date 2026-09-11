import "server-only";
import { type StorageError, StorageErrorCode } from "@formbricks/storage";
import { TResponseData } from "@formbricks/types/responses";
import {
  type TAccessType,
  type TAllowedFileExtension,
  ZAllowedFileExtension,
} from "@formbricks/types/storage";
import { TSurveyBlock } from "@formbricks/types/surveys/blocks";
import { TSurveyElementTypeEnum, TSurveyFileUploadElement } from "@formbricks/types/surveys/elements";
import { TSurveyQuestion, TSurveyQuestionTypeEnum } from "@formbricks/types/surveys/types";
import { responses } from "@/app/lib/api/response";
import { WEBAPP_URL } from "@/lib/constants";
import { getPublicDomain } from "@/lib/getPublicUrl";
import { getOriginalFileNameFromUrl } from "./url-helpers";

// Re-export for backward compatibility with server-side code
export { getOriginalFileNameFromUrl } from "./url-helpers";

/**
 * Sanitize a provided file name to a safe subset.
 * - Removes path separators and backslashes to avoid implicit prefixes
 * - Drops ASCII control chars and reserved URL chars which often break S3 form fields
 * - Collapses whitespace
 * - Limits length to a reasonable maximum
 * - Preserves last extension only
 */
export const sanitizeFileName = (rawFileName: string): string => {
  if (!rawFileName) return "";

  // Normalize to NFC to avoid weird Unicode composition differences
  let name = rawFileName.normalize("NFC");

  // Replace path separators/backslashes with dash
  name = name.replace(/[\\/]/g, "-");

  // Disallow: # <> : " | ? * ` ' and control whitespace
  name = name.replace(/[#<>:"|?*`']/g, "");

  // Collapse and trim whitespace
  name = name.replace(/\s+/g, " ").trim();

  // Split into base and extension; keep only the last extension
  const parts = name.split(".");
  const hasExt = parts.length > 1;
  const ext = hasExt ? parts.pop()! : "";
  let base = (hasExt ? parts.join(".") : parts[0]).trim();

  // Fallback base if empty after sanitization
  if (!base) return "";
  // Reject bases that are only punctuation like hyphens or dots
  if (/^-+$/.test(base) || /^\.+$/.test(base)) return "";

  // Enforce max lengths (S3 key limit is 1024; be conservative for filename)
  const MAX_BASE = 200;
  const MAX_EXT = 20;
  if (base.length > MAX_BASE) base = base.slice(0, MAX_BASE);
  const safeExt = ext.slice(0, MAX_EXT).replace(/[^A-Za-z0-9]/g, "");

  const result = safeExt ? `${base}.${safeExt}` : base;
  // Final guard: empty or just dots/hyphens shouldn't pass
  if (!result || /^\.*$/.test(result) || /^-+$/.test(result)) return "";
  return result;
};

/**
 * Extracts the lowercase file extension from a file name
 * @param fileName The name of the file
 * @returns {string | null} The lowercase extension, or null when no extension exists
 */
const extractFileExtension = (fileName: string): string | null => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension || extension === fileName.toLowerCase()) return null;

  return extension;
};

/**
 * Validates if the file extension is allowed
 * @param fileName The name of the file to validate
 * @returns {boolean} True if the file extension is allowed, false otherwise
 */
/**
 * Check whether the file's extension is in the globally allowed set.
 *
 * @param fileName — the file name to validate
 * @returns — true if the extension is permitted
 */
export const isAllowedFileExtension = (fileName: string): boolean => {
  const extension = extractFileExtension(fileName);
  if (!extension) return false;

  // Check if the extension is in the allowed list
  return Object.values(ZAllowedFileExtension.enum).includes(extension as TAllowedFileExtension);
};

/**
 * Validate that a single file URL references a file whose extension is
 * in the allowed list (or that no list was specified).
 *
 * @param fileUrl — the storage file URL
 * @param allowedFileExtensions — optional per-question allowed list
 * @returns — true if the file passes extension validation
 */
export const validateSingleFile = (
  fileUrl: string,
  allowedFileExtensions?: TAllowedFileExtension[]
): boolean => {
  const fileName = getOriginalFileNameFromUrl(fileUrl);
  if (!fileName) return false;
  const extension = extractFileExtension(fileName);
  if (!extension) return false;
  return !allowedFileExtensions || allowedFileExtensions.includes(extension as TAllowedFileExtension);
};

/**
 * Validate all file-upload responses in a response data object against
 * their respective question-level allowed-extension lists.
 *
 * @param data — the full response data
 * @param questions — survey questions to find FileUpload configs
 * @returns — true if all file uploads are valid
 */
export const validateFileUploads = (data?: TResponseData, questions?: TSurveyQuestion[]): boolean => {
  if (!data) return true;
  for (const key of Object.keys(data)) {
    const question = questions?.find((q) => q.id === key);
    if (!question || question.type !== TSurveyQuestionTypeEnum.FileUpload) continue;

    const fileUrls = data[key];

    if (!Array.isArray(fileUrls) || !fileUrls.every((url) => typeof url === "string")) return false;

    for (const fileUrl of fileUrls) {
      if (!validateSingleFile(fileUrl, question.allowedFileExtensions)) return false;
    }
  }

  return true;
};

export type TSurveyFileUploadPermissionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "no_file_upload_element" | "file_upload_element_not_found" | "file_extension_not_allowed";
    };

const getAllowedFileExtensionFromFileName = (fileName: string): TAllowedFileExtension | null => {
  const extension = extractFileExtension(fileName);
  if (!extension) return null;

  const extensionValidation = ZAllowedFileExtension.safeParse(extension);

  return extensionValidation.success ? extensionValidation.data : null;
};

const getSurveyFileUploadConfigs = ({
  blocks,
  questions,
}: {
  blocks?: TSurveyBlock[] | null;
  questions?: TSurveyQuestion[] | null;
}): TSurveyFileUploadElement[] => {
  return [
    ...(blocks ?? [])
      .flatMap((block) => block.elements)
      .filter((element) => element.type === TSurveyElementTypeEnum.FileUpload),
    ...(questions ?? []).filter((question) => question.type === TSurveyQuestionTypeEnum.FileUpload),
  ] as TSurveyFileUploadElement[];
};

/**
 * Check that the survey (via blocks or legacy questions) has a FileUpload
 * element matching elementId and that the file's extension is permitted.
 *
 * @param fileName — the file name being uploaded
 * @param elementId — the question/element ID
 * @param blocks — survey blocks (modern structure)
 * @param questions — legacy survey questions
 * @returns — { ok: true } or { ok: false, reason }
 */
export const validateSurveyAllowsFileUpload = ({
  fileName,
  elementId,
  blocks,
  questions,
}: {
  fileName: string;
  elementId: string;
  blocks?: TSurveyBlock[] | null;
  questions?: TSurveyQuestion[] | null;
}): TSurveyFileUploadPermissionResult => {
  const fileUploadConfigs = getSurveyFileUploadConfigs({ blocks, questions });

  if (fileUploadConfigs.length === 0) {
    return {
      ok: false,
      reason: "no_file_upload_element",
    };
  }

  const fileUploadConfig = fileUploadConfigs.find((config) => config.id === elementId);

  if (!fileUploadConfig) {
    return {
      ok: false,
      reason: "file_upload_element_not_found",
    };
  }

  const fileExtension = getAllowedFileExtensionFromFileName(fileName);

  if (!fileExtension) {
    return {
      ok: false,
      reason: "file_extension_not_allowed",
    };
  }

  const { allowedFileExtensions } = fileUploadConfig;
  const isFileExtensionAllowed =
    allowedFileExtensions === undefined || allowedFileExtensions.includes(fileExtension);

  return isFileExtensionAllowed
    ? { ok: true }
    : {
        ok: false,
        reason: "file_extension_not_allowed",
      };
};

const getStorageUrlPathSegments = (fileUrl: string): string[] | null => {
  if (!fileUrl.startsWith("/storage/")) return null;

  const pathWithoutSearch = fileUrl.split(/[?#]/)[0];
  return pathWithoutSearch.split("/").filter(Boolean);
};

type TParsedStorageFileUrl = {
  storageId: string;
  accessType: TAccessType;
  fileName: string;
};

/**
 * Parse a storage URL into its components: storageId, accessType, fileName.
 *
 * @param fileUrl — a relative (/storage/...) or absolute URL
 * @returns — the parsed components or null if the URL is not a valid storage URL
 *
 * @example
 * ```typescript
 * parseStorageFileUrl("/storage/ws1/public/report.pdf")
 * // => { storageId: "ws1", accessType: "public", fileName: "report.pdf" }
 * ```
 */
export const parseStorageFileUrl = (fileUrl: string): TParsedStorageFileUrl | null => {
  let pathname: string;

  try {
    pathname = fileUrl.startsWith("/storage/") ? fileUrl : new URL(fileUrl).pathname;
  } catch {
    return null;
  }

  const pathWithoutSearch = pathname.split(/[?#]/)[0];
  if (!pathWithoutSearch.startsWith("/storage/")) return null;

  const [storageSegment, storageId, accessType, ...fileNameSegments] = pathWithoutSearch
    .split("/")
    .filter(Boolean);
  const fileName = fileNameSegments.join("/");

  if (
    storageSegment !== "storage" ||
    !storageId ||
    !fileName ||
    (accessType !== "private" && accessType !== "public")
  ) {
    return null;
  }

  return { storageId, accessType, fileName };
};

const isScopedPrivateUploadUrl = ({
  fileUrl,
  workspaceId,
  surveyId,
  elementId,
}: {
  fileUrl: string;
  workspaceId: string;
  surveyId: string;
  elementId: string;
}): boolean => {
  const segments = getStorageUrlPathSegments(fileUrl);

  if (segments?.length !== 8) return false;

  const [
    storageSegment,
    storageWorkspaceId,
    accessType,
    surveysSegment,
    storageSurveyId,
    elementsSegment,
    storageElementId,
    fileName,
  ] = segments;

  return (
    storageSegment === "storage" &&
    storageWorkspaceId === workspaceId &&
    accessType === "private" &&
    surveysSegment === "surveys" &&
    storageSurveyId === surveyId &&
    elementsSegment === "elements" &&
    storageElementId === elementId &&
    Boolean(fileName)
  );
};

/**
 * Client-side validation that all file-upload URLs in a response are:
 * 1. Allowed extensions
 * 2. Properly scoped under the correct workspace/survey/element path
 *
 * @param data — the response data
 * @param workspaceId — expected workspace scope
 * @param surveyId — expected survey scope
 * @param blocks — survey blocks
 * @param questions — legacy survey questions
 * @returns — true if all file uploads are valid and correctly scoped
 */
export const validateClientFileUploads = ({
  data,
  workspaceId,
  surveyId,
  blocks,
  questions,
}: {
  data?: TResponseData;
  workspaceId: string;
  surveyId: string;
  blocks?: TSurveyBlock[] | null;
  questions?: TSurveyQuestion[] | null;
}): boolean => {
  if (!data) return true;

  const fileUploadConfigs = getSurveyFileUploadConfigs({ blocks, questions });

  for (const fileUploadConfig of fileUploadConfigs) {
    const fileUrls = data[fileUploadConfig.id];

    if (fileUrls === undefined) continue;
    if (!Array.isArray(fileUrls) || !fileUrls.every((url) => typeof url === "string")) return false;

    for (const fileUrl of fileUrls) {
      if (!validateSingleFile(fileUrl, fileUploadConfig.allowedFileExtensions)) return false;
      if (
        !isScopedPrivateUploadUrl({
          fileUrl,
          workspaceId,
          surveyId,
          elementId: fileUploadConfig.id,
        })
      ) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Check whether a stored file URL points to a recognised image format
 * (png, jpeg, jpg, webp, heic).
 *
 * @param fileUrl — the storage file URL
 * @returns — true if it appears to be an image
 */
export const isValidImageFile = (fileUrl: string): boolean => {
  const fileName = getOriginalFileNameFromUrl(fileUrl);
  if (!fileName || fileName.endsWith(".")) return false;

  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return false;

  const imageExtensions = ["png", "jpeg", "jpg", "webp", "heic"];
  return imageExtensions.includes(extension);
};

/**
 * Convert a StorageError (from @formbricks/storage) into the appropriate
 * HTTP Response with status code and error message.
 *
 * @param error — the storage error
 * @param details — optional extra context for the response body
 * @returns — a Next.js-compatible Response object
 */
export const getErrorResponseFromStorageError = (
  error: StorageError,
  details?: Record<string, string>
): Response => {
  switch (error.code) {
    case StorageErrorCode.FileNotFoundError:
      return responses.notFoundResponse("file", details?.fileName ?? null, true);
    case StorageErrorCode.InvalidInput:
      return responses.badRequestResponse("Invalid input", details, true);
    case StorageErrorCode.S3ClientError:
    case StorageErrorCode.S3CredentialsError:
      return responses.internalServerErrorResponse(
        "File storage is not configured correctly. Please check your file upload settings.",
        true,
        { storage_error_code: error.code },
        "private, no-store"
      );
    case StorageErrorCode.Unknown:
      return responses.internalServerErrorResponse("Internal server error", true);
    default: {
      return responses.internalServerErrorResponse("Internal server error", true);
    }
  }
};

/**
 * Resolves a storage URL to an absolute URL.
 * - If already absolute, returns as-is
 * - If relative (/storage/...), prepends the appropriate base URL
 * @param url The storage URL (relative or absolute)
 * @param accessType The access type to determine which base URL to use (defaults to "public")
 * @returns The resolved absolute URL, or empty string if url is falsy
 */
/**
 * Resolve a potentially relative storage URL to an absolute URL.
 * Already-absolute URLs are returned as-is.
 *
 * @param url — the storage URL (relative like /storage/... or absolute)
 * @param accessType — "public" uses the public domain, "private" uses WEBAPP_URL
 * @returns — the fully resolved absolute URL, or empty string if url is falsy
 *
 * @example
 * ```typescript
 * resolveStorageUrl("/storage/ws1/public/report.pdf")
 * // => "https://app.formbricks.com/storage/ws1/public/report.pdf"
 * ```
 */
export const resolveStorageUrl = (
  url: string | undefined | null,
  accessType: "public" | "private" = "public"
): string => {
  if (!url) return "";

  // Already absolute URL - return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Relative path - resolve with base URL
  if (url.startsWith("/storage/")) {
    const baseUrl = accessType === "public" ? getPublicDomain() : WEBAPP_URL;
    return `${baseUrl}${url}`;
  }

  return url;
};

// Matches the actual storage URL format: /storage/{id}/{public|private}/{filename...}
const STORAGE_URL_PATTERN = /^\/storage\/[^/]+\/(public|private)\/.+/;

const isStorageUrl = (value: string): boolean => STORAGE_URL_PATTERN.test(value);

/**
 * Resolve a storage URL to absolute, auto-detecting the access type from
 * the path segment (public vs private).
 *
 * @param url — the storage URL
 * @returns — the absolute URL, or the original string if it is not a storage URL
 */
export const resolveStorageUrlAuto = (url: string): string => {
  if (!isStorageUrl(url)) return url;
  const accessType = url.includes("/private/") ? "private" : "public";
  return resolveStorageUrl(url, accessType);
};

/**
 * Recursively walks an object/array and resolves all relative storage URLs
 * Preserves the original structure; skips Date instances and non-object primitives.
 */
/**
 * Recursively walk an object/array and resolve every relative storage URL
 * to an absolute URL. Preserves the original structure; Date instances and
 * non-object primitives are left untouched.
 *
 * @param obj — the input (object, array, or primitive)
 * @returns — the same structure with all storage URLs resolved
 *
 * @example
 * ```typescript
 * resolveStorageUrlsInObject({ avatar: "/storage/ws1/public/photo.jpg" })
 * // => { avatar: "https://app.formbricks.com/storage/ws1/public/photo.jpg" }
 * ```
 */
export const resolveStorageUrlsInObject = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return resolveStorageUrlAuto(obj) as T;
  }

  if (typeof obj !== "object") return obj;

  if (obj instanceof Date) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => resolveStorageUrlsInObject(item)) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = resolveStorageUrlsInObject(value);
  }

  return result as T;
};
