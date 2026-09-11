/**
 * i18n translation function signature used in email templates — takes a key
 * and optional replacement map, returns the localised string.
 */
export type TFunction = (key: string, replacements?: Record<string, string>) => string;
