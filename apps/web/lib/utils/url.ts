/**
 * URL matching utilities for action-class page URL rules.
 *
 * Supports: exactMatch, contains, startsWith, endsWith, notMatch, notContains,
 * matchesRegex — used by the action-class editor and the JS client's no-code
 * event detection.
 */
import { TActionClassPageUrlRule } from "@formbricks/types/action-classes";

/**
 * Tests whether a URL matches a given page URL rule.
 *
 * @param testUrl — the URL to test
 * @param pageUrlValue — the rule's comparison value
 * @param pageUrlRule — the rule type
 * @param t — i18n translate function (for error messages)
 */
export const testURLmatch = (
  testUrl: string,
  pageUrlValue: string,
  pageUrlRule: TActionClassPageUrlRule,
  t: (key: string) => string
): boolean => {
  let regex: RegExp;

  switch (pageUrlRule) {
    case "exactMatch":
      return testUrl === pageUrlValue;
    case "contains":
      return testUrl.includes(pageUrlValue);
    case "startsWith":
      return testUrl.startsWith(pageUrlValue);
    case "endsWith":
      return testUrl.endsWith(pageUrlValue);
    case "notMatch":
      return testUrl !== pageUrlValue;
    case "notContains":
      return !testUrl.includes(pageUrlValue);
    case "matchesRegex":
      try {
        regex = new RegExp(pageUrlValue);
      } catch {
        throw new Error(t("workspace.actions.invalid_regex"));
      }

      return regex.test(testUrl);
    default:
      throw new Error(t("workspace.actions.invalid_match_type"));
  }
};

/**
 * Validates a callback URL against the WEBAPP_URL origin to prevent open redirects.
 * Only allows same-origin absolute URLs and safe root-relative paths.
 *
 * @param url — the URL to validate
 * @param WEBAPP_URL — the application's base URL
 * @returns — the validated URL string, or null
 */
export const getValidatedCallbackUrl = (
  url: string | null | undefined,
  WEBAPP_URL: string
): string | null => {
  if (!url) {
    return null;
  }

  try {
    const parsedWebAppUrl = new URL(WEBAPP_URL);
    const isAbsoluteUrl = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url);
    const isRootRelativePath = url.startsWith("/");

    // Reject ambiguous non-URL values like "foo" while still allowing safe root-relative paths.
    if (!isAbsoluteUrl && !isRootRelativePath) {
      return null;
    }

    const parsedUrl = isAbsoluteUrl ? new URL(url) : new URL(url, parsedWebAppUrl.origin);
    const allowedSchemes = ["https:", "http:"];
    const allowedOrigins = new Set([parsedWebAppUrl.origin]);

    if (!allowedSchemes.includes(parsedUrl.protocol)) {
      return null;
    }

    if (!allowedOrigins.has(parsedUrl.origin)) {
      return null;
    }

    if (parsedUrl.username || parsedUrl.password) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
};

/** Quick check whether a string is a valid URL. */
export const isStringUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
