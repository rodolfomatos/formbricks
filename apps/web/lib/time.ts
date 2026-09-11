import { type Locale, formatDistance } from "date-fns";
import { de, enUS, es, fr, hu, ja, nl, pt, ptBR, ro, ru, sv, tr, zhCN, zhTW } from "date-fns/locale";
import { TUserLocale } from "@formbricks/types/user";
import { formatDateForDisplay } from "./utils/datetime";

const DEFAULT_LOCALE: TUserLocale = "en-US";
const TIME_SINCE_LOCALES: Record<TUserLocale, Locale> = {
  "de-DE": de,
  "en-US": enUS,
  "es-ES": es,
  "fr-FR": fr,
  "hu-HU": hu,
  "ja-JP": ja,
  "nl-NL": nl,
  "pt-BR": ptBR,
  "pt-PT": pt,
  "ro-RO": ro,
  "ru-RU": ru,
  "sv-SE": sv,
  "tr-TR": tr,
  "zh-Hans-CN": zhCN,
  "zh-Hant-TW": zhTW,
};

const isUserLocale = (locale: string): locale is TUserLocale => Object.hasOwn(TIME_SINCE_LOCALES, locale);

/** Maps locale strings to date-fns locales and falls back to English for unsupported inputs. */
const getLocaleForTimeSince = (locale: string): Locale =>
  isUserLocale(locale) ? TIME_SINCE_LOCALES[locale] : enUS;

/**
 * Formats a past date as a human-readable relative string (e.g. "5 minutes ago")
 * in the user's locale. Used wherever audit trails or activity feeds need to
 * show temporal distance without an absolute timestamp.
 *
 * @param dateString — ISO-8601 string to compute distance from
 * @param locale — user locale for i18n (defaults to en-US)
 * @returns — localised relative-time string with suffix
 */
export const timeSince = (dateString: string, locale: string = DEFAULT_LOCALE) => {
  const date = new Date(dateString);
  return formatDistance(date, new Date(), {
    addSuffix: true,
    locale: getLocaleForTimeSince(locale),
  });
};

/**
 * Same as `timeSince` but accepts a Date object directly.
 * Used when the caller already has a parsed Date and wants to avoid re-parsing.
 *
 * @param date — parsed Date to compute distance from
 * @param locale — user locale for i18n
 * @returns — localised relative-time string with suffix
 */
export const timeSinceDate = (date: Date, locale: string = DEFAULT_LOCALE) => {
  return formatDistance(date, new Date(), {
    addSuffix: true,
    locale: getLocaleForTimeSince(locale),
  });
};

/**
 * Formats a Date into a localised long-date string (e.g. "June 28, 2026").
 * Used for displaying absolute dates in tables, detail panels, and emails.
 *
 * @param date — the Date to format
 * @param locale — user locale for i18n
 * @returns — localised date string
 */
export const formatDate = (date: Date, locale: string = DEFAULT_LOCALE) => {
  return formatDateForDisplay(date, locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Builds a compact date-time token using an arbitrary separator.
 * Used internally for file names, API parameters, and log prefixes
 * where a stable, sortable string format is needed.
 *
 * @param seperator — character(s) to join date and time segments
 * @returns — "YYYY{sep}MM{sep}DD{sep}HH{sep}mm{sep}SS"
 *
 * @example
 * ```typescript
 * getTodaysDateTimeFormatted("-") // => "2026-06-28-15-30-00"
 * ```
 */
export const getTodaysDateTimeFormatted = (seperator: string) => {
  const date = new Date();
  const formattedDate = date.toISOString().split("T")[0].split("-").join(seperator);
  const formattedTime = date.toTimeString().split(" ")[0].split(":").join(seperator);

  return [formattedDate, formattedTime].join(seperator);
};

/**
 * Recursively walks an object tree and converts ISO-8601 string values at
 * well-known date keys (`createdAt`, `updatedAt`) into native Date instances.
 * Solves the mismatch between Prisma returning ISO strings and UI code
 * expecting Date objects.
 *
 * @param obj — the value to transform (object, array, or primitive)
 * @param keysToIgnore — optional set of top-level keys to skip conversion for
 * @returns — a deeply-cloned copy with dates materialised
 *
 * @example
 * ```typescript
 * convertDatesInObject({ createdAt: "2026-06-28T00:00:00.000Z" })
 * // => { createdAt: Date("2026-06-28T00:00:00.000Z") }
 * ```
 */
export const convertDatesInObject = <T>(obj: T, keysToIgnore?: Set<string>): T => {
  if (obj === null || typeof obj !== "object") {
    return obj; // Return if obj is not an object
  }
  if (Array.isArray(obj)) {
    // Handle arrays by mapping each element through the function
    return obj.map((item) => convertDatesInObject(item, keysToIgnore)) as unknown as T;
  }
  const newObj: Record<string, unknown> = {};
  for (const key in obj) {
    if (keysToIgnore?.has(key)) {
      newObj[key] = obj[key];
      continue;
    }
    if (
      (key === "createdAt" || key === "updatedAt") &&
      typeof obj[key] === "string" &&
      !isNaN(Date.parse(obj[key] as unknown as string))
    ) {
      newObj[key] = new Date(obj[key] as unknown as string);
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      newObj[key] = convertDatesInObject(obj[key], keysToIgnore);
    } else {
      newObj[key] = obj[key];
    }
  }
  return newObj as T;
};
