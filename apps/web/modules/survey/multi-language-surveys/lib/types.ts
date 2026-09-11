import { TI18nString } from "@formbricks/types/i18n";

/** Describes a single translatable string field within a survey: its logical path, display label, current i18n value, and whether it uses rich text. */
export interface TranslatableString {
  path: string;
  displayId: string;
  fieldLabel: string;
  value: TI18nString;
  isRichText: boolean;
  elementId: string;
}

/** Tracks how many of the translatable strings have been filled for a given language code. */
export interface TranslationProgress {
  translated: number;
  total: number;
  percentage: number;
}
