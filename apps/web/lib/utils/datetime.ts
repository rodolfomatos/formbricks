const DEFAULT_LOCALE = "en-US";

const DEFAULT_DATE_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const DEFAULT_DATE_TIME_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

/** Calculates the absolute difference in days between two dates. */
export const diffInDays = (date1: Date, date2: Date) => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/** Formats a date for display using Intl.DateTimeFormat with the given locale. */
export const formatDateForDisplay = (
  date: Date,
  locale: string = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_DISPLAY_OPTIONS
): string => {
  return new Intl.DateTimeFormat(locale, options).format(date);
};

/** Formats a date with time for display using Intl.DateTimeFormat. */
export const formatDateTimeForDisplay = (
  date: Date,
  locale: string = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_TIME_DISPLAY_OPTIONS
): string => {
  return new Intl.DateTimeFormat(locale, options).format(date);
};

/** Formats a date with ordinal suffix (e.g. "Jan 5th, 2025") using the given locale. */
export const formatDateWithOrdinal = (date: Date, locale: string = DEFAULT_LOCALE): string => {
  return formatDateForDisplay(date, locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/** Checks whether a string can be parsed as a valid date. */
export const isValidDateString = (value: string) => {
  const regex = /^(?:\d{4}-\d{1,2}-\d{1,2}|\d{1,2}-\d{1,2}-\d{4})$/;

  if (!regex.test(value)) {
    return false;
  }

  const normalizedValue = /^\d{1,2}-\d{1,2}-\d{4}$/.test(value)
    ? value.replace(/(\d{1,2})-(\d{1,2})-(\d{4})/, "$3-$2-$1")
    : value;

  const date = new Date(normalizedValue);
  return !Number.isNaN(date.getTime());
};

/** Formats a date as a stable sortable string (YYYY-MM-DD HH:MM:SS) for exports. */
export const getFormattedDateTimeString = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  };

  return new Intl.DateTimeFormat("en-CA", options).format(date).replace(",", "");
};
