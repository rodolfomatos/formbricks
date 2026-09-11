/** Validates that a string is a safe identifier (lowercase letters, digits, underscores, no leading digit). */
export const isSafeIdentifier = (value: string): boolean => {
  // Must start with a lowercase letter
  if (!/^[a-z]/.test(value)) {
    return false;
  }
  // Can only contain lowercase letters, numbers, and underscores
  return /^[a-z0-9_]+$/.test(value);
};

/** Normalises any string to a safe identifier (lowercase letters, digits, underscores). Strips invalid leading chars. */
export const toSafeIdentifier = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  let safeIdentifier = "";
  let shouldInsertUnderscore = false;

  for (const char of normalized) {
    const isLowercaseLetter = char >= "a" && char <= "z";
    const isDigit = char >= "0" && char <= "9";

    if (isLowercaseLetter || isDigit) {
      if (shouldInsertUnderscore && safeIdentifier.length > 0) {
        safeIdentifier += "_";
      }
      safeIdentifier += char;
      shouldInsertUnderscore = false;
      continue;
    }

    if (safeIdentifier.length > 0) {
      shouldInsertUnderscore = true;
    }
  }

  for (let i = 0; i < safeIdentifier.length; i++) {
    const char = safeIdentifier[i];
    if (char >= "a" && char <= "z") {
      return safeIdentifier.slice(i);
    }
  }

  return "";
};

/** Converts a snake_case string to Title Case for display (e.g. "job_title" → "Job Title"). */
export const formatSnakeCaseToTitleCase = (key: string): string => {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
