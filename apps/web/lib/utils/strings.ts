/** Truncates a string to a maximum length, appending "..." if truncated. */
export const truncate = (str: string, length: number) => {
  if (!str) return "";
  if (str.length > length) {
    return str.substring(0, length) + "...";
  }
  return str;
};

/**
 * Removes characters unsafe for URLs/filesystem and truncates.
 * Non-alphanumeric/ASCII chars are replaced with the delimiter.
 */
export const sanitizeString = (str: string, delimiter: string = "_", length: number = 255) => {
  return str.replace(/[^0-9a-zA-Z\-._]+/g, delimiter).substring(0, length);
};

/** Checks whether the first character is uppercase. */
export const isCapitalized = (str: string) => str.charAt(0) === str.charAt(0).toUpperCase();

/** Checks whether a string starts with a vowel (English). */
export const startsWithVowel = (str: string): boolean => {
  return /^[aeiouAEIOU]/.test(str);
};

/** Truncates with "..." ellipsis; alias for consistent usage vs. `truncate`. */
export const truncateText = (text: string, limit: number): string => {
  return text.length > limit ? `${text.substring(0, limit)}...` : text;
};
