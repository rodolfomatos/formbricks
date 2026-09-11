/**
 * Date display formatting for survey date elements.
 *
 * Parses stored date values (ISO-8601 or legacy format strings) and formats them
 * for display using locale-aware methods. The `TSurveyDateFormatMap` tracks each
 * element's configured date format for correct parsing.
 */
import type { TSurveyDateElement, TSurveyElement } from "@formbricks/types/surveys/elements";
import { formatDateWithOrdinal } from "./datetime";

export type TSurveyDateFormatMap = Partial<Record<string, TSurveyDateElement["format"]>>;

const ISO_STORED_DATE_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

const buildDate = (year: number, month: number, day: number): Date | null => {
  if ([year, month, day].some((value) => Number.isNaN(value))) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
};

const parseLegacyStoredDateValue = (value: string, format: TSurveyDateElement["format"]): Date | null => {
  const parts = value.split("-");

  if (parts.length !== 3 || parts.some((part) => !/^\d{1,4}$/.test(part))) {
    return null;
  }

  const [first, second, third] = parts.map(Number);

  switch (format) {
    case "M-d-y":
      return buildDate(third, first, second);
    case "d-M-y":
      return buildDate(third, second, first);
    case "y-M-d":
      return buildDate(first, second, third);
  }
};

/**
 * Parses a stored date string (ISO-8601 or legacy M-d-y / d-M-y / y-M-d) into a Date.
 *
 * @param value — the stored value
 * @param format — optional legacy format hint
 * @returns — the parsed Date, or null
 */
export const parseStoredDateValue = (value: string, format?: TSurveyDateElement["format"]): Date | null => {
  const isoMatch = ISO_STORED_DATE_PATTERN.exec(value);

  if (isoMatch) {
    return buildDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  if (format) {
    return parseLegacyStoredDateValue(value, format);
  }

  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(value)) {
    return parseLegacyStoredDateValue(value, "d-M-y");
  }

  return null;
};

/**
 * Converts a stored date value into a locale-formatted display string (with ordinal).
 *
 * @param value — the stored date string
 * @param format — optional legacy format hint
 * @param locale — the target locale (default: en-US)
 * @returns — the formatted string, or null if unparseable
 */
export const formatStoredDateForDisplay = (
  value: string,
  format: TSurveyDateElement["format"] | undefined,
  locale: string = "en-US"
): string | null => {
  const parsedDate = parseStoredDateValue(value, format);

  if (!parsedDate) {
    return null;
  }

  return formatDateWithOrdinal(parsedDate, locale);
};

/** Builds a map of element ID → date format for all date-type elements in a survey. */
export const getSurveyDateFormatMap = (elements: TSurveyElement[]): TSurveyDateFormatMap => {
  return elements.reduce<TSurveyDateFormatMap>((dateFormats, element) => {
    if (element.type === "date") {
      dateFormats[element.id] = element.format;
    }

    return dateFormats;
  }, {});
};
