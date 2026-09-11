/**
 * Client-safe URL helper utilities for storage files.
 * These functions can be used in both server and client components.
 */

/**
 * Extracts the original file name from a storage URL.
 * Handles both relative paths (/storage/...) and absolute URLs.
 * @param fileURL The storage URL to parse
 * @returns The original file name, or empty string if parsing fails
 */
/**
 * Extract the original human-readable file name from a storage URL.
 * Handles both relative paths (/storage/...) and absolute URLs, stripping
 * the internal `--fid--{uuid}` suffix inserted during upload.
 *
 * @param fileURL — the storage URL to parse
 * @returns — the original file name, or empty string if parsing fails
 *
 * @example
 * ```typescript
 * getOriginalFileNameFromUrl("/storage/ws1/public/report--fid--abc123.pdf")
 * // => "report.pdf"
 * ```
 */
export const getOriginalFileNameFromUrl = (fileURL: string): string => {
  try {
    const lastSegment = fileURL.startsWith("/storage/")
      ? (fileURL.split("/").pop() ?? "")
      : (new URL(fileURL).pathname.split("/").pop() ?? "");
    const fileNameFromURL = lastSegment.split(/[?#]/)[0];

    const [namePart, fidPart] = fileNameFromURL.split("--fid--");
    if (!fidPart) return namePart ? decodeURIComponent(namePart) : "";

    const dotIdx = fileNameFromURL.lastIndexOf(".");
    const hasExt = dotIdx > fileNameFromURL.indexOf("--fid--");
    const ext = hasExt ? fileNameFromURL.slice(dotIdx + 1) : "";

    return decodeURIComponent(ext ? `${namePart}.${ext}` : namePart);
  } catch {
    return "";
  }
};
