import { STORAGE_CONFIGURATION_ERROR_CODES, type TStorageApiErrorDetails } from "@formbricks/types/storage";

/**
 * Categorised error codes for file-upload operations. Used to surface
 * specific, translatable error messages to users.
 */
export enum FileUploadError {
  NO_FILE = "no_file",
  INVALID_FILE_TYPE = "invalid_file_type",
  FILE_SIZE_EXCEEDED = "file_size_exceeded",
  UPLOAD_FAILED = "upload_failed",
  INVALID_FILE_NAME = "invalid_file_name",
  STORAGE_NOT_CONFIGURED = "storage_not_configured",
  STORAGE_UPLOAD_FAILED = "storage_upload_failed",
}

type UploadApiErrorResponse = {
  details?: TStorageApiErrorDetails;
};

const parseUploadApiError = async (response: Response): Promise<UploadApiErrorResponse | undefined> => {
  try {
    return (await response.json()) as UploadApiErrorResponse;
  } catch {
    return undefined;
  }
};

const getFileUploadErrorFromResponse = async (response: Response): Promise<FileUploadError> => {
  const json = await parseUploadApiError(response);

  if (response.status === 400 && json?.details?.fileName) {
    return FileUploadError.INVALID_FILE_NAME;
  }

  if (
    response.status >= 500 &&
    json?.details?.storage_error_code &&
    STORAGE_CONFIGURATION_ERROR_CODES.has(json.details.storage_error_code)
  ) {
    return FileUploadError.STORAGE_NOT_CONFIGURED;
  }

  return FileUploadError.UPLOAD_FAILED;
};

/**
 * Convert a File to a base64 data URL string so it can be embedded in
 * FormData for S3 presigned-post uploads.
 *
 * @param file — the file to convert
 * @returns — a promise resolving to the base64 data URL
 */
export const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
  });

/**
 * Upload a file through the Formbricks management API. Validates size,
 * requests a presigned URL, and pushes the file to S3 via the presigned POST.
 *
 * @param file — the file to upload
 * @param workspaceId — used to scope the storage path
 * @param allowedFileExtensions — optional filter; rejects unlisted extensions server-side
 * @returns — the final file URL on success, or an error code
 *
 * @example
 * ```typescript
 * const { error, url } = await handleFileUpload(myFile, "ws_123");
 * if (error) showFileUploadErrorToast(error, t);
 * ```
 */
export const handleFileUpload = async (
  file: File,
  workspaceId: string,
  allowedFileExtensions?: string[]
): Promise<{
  error?: FileUploadError;
  url: string;
}> => {
  try {
    if (!(file instanceof File)) {
      return {
        error: FileUploadError.NO_FILE,
        url: "",
      };
    }
    const fileBuffer = await file.arrayBuffer();

    const bufferBytes = fileBuffer.byteLength;
    const bufferKB = bufferBytes / 1024;

    const MAX_FILE_SIZE_MB = 5;
    const maxSizeInKB = MAX_FILE_SIZE_MB * 1024;
    if (bufferKB > maxSizeInKB) {
      return {
        error: FileUploadError.FILE_SIZE_EXCEEDED,
        url: "",
      };
    }

    const payload = {
      fileName: file.name,
      fileType: file.type,
      allowedFileExtensions,
      workspaceId,
    };

    const response = await fetch("/api/v1/management/storage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        error: await getFileUploadErrorFromResponse(response),
        url: "",
      };
    }

    const json = await response.json();
    const { data } = json;

    const { signedUrl, fileUrl, presignedFields } = data as {
      signedUrl: string;
      presignedFields: Record<string, string>;
      fileUrl: string;
    };

    const fileBase64 = (await toBase64(file)) as string;
    const formDataForS3 = new FormData();

    Object.entries(presignedFields).forEach(([key, value]) => {
      formDataForS3.append(key, value);
    });

    try {
      const binaryString = atob(fileBase64.split(",")[1]);
      const uint8Array = Uint8Array.from([...binaryString].map((char) => char.charCodeAt(0)));
      const blob = new Blob([uint8Array], { type: file.type });

      formDataForS3.append("file", blob);
    } catch (err) {
      console.error("Error in uploading file: ", err);
      return {
        error: FileUploadError.UPLOAD_FAILED,
        url: "",
      };
    }

    let uploadResponse: Response;

    try {
      uploadResponse = await fetch(signedUrl, {
        method: "POST",
        body: formDataForS3,
      });
    } catch (err) {
      console.error("Error in uploading file: ", err);
      return {
        error: FileUploadError.STORAGE_UPLOAD_FAILED,
        url: "",
      };
    }

    if (!uploadResponse.ok) {
      return {
        error: FileUploadError.STORAGE_UPLOAD_FAILED,
        url: "",
      };
    }

    return {
      url: fileUrl,
    };
  } catch (error) {
    console.error("Error in uploading file: ", error);
    return {
      error: FileUploadError.UPLOAD_FAILED,
      url: "",
    };
  }
};
