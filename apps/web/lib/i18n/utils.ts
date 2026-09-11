/**
 * i18n utility functions for survey content localisation.
 *
 * Survey content (headlines, descriptions, labels) is stored as `TI18nString` — a
 * `Record<languageCode, string>`. These helpers handle creating, reading, and
 * migrating those objects across language sets so multi-language surveys render
 * correctly without empty or stale language keys.
 */
import { iso639Languages } from "@formbricks/i18n-utils/src/utils";
import { TI18nString } from "@formbricks/types/i18n";
import { TSurveyLanguage } from "@formbricks/types/surveys/types";
import { TLanguage } from "@formbricks/types/workspace";
import { structuredClone } from "@/lib/pollyfills/structuredClone";

/**
 * Normalises a plain string or existing TI18nString into a TI18nString for the given language set.
 * When an existing object is passed, unknown language keys are dropped and missing keys are added
 * as empty strings so downstream code never encounters undefined.
 *
 * @param text — plain string (converted to target language) or existing i18n object
 * @param languages — list of language codes the object should cover
 * @param targetLanguageCode — the language this text corresponds to (default "default")
 * @returns — a complete TI18nString with all language keys present
 *
 * @example
 * ```typescript
 * createI18nString("Hello", ["en-US", "de-DE"]) // => { default: "Hello", "de-DE": "" }
 * ```
 */
export const createI18nString = (
  text: string | TI18nString,
  languages: string[],
  targetLanguageCode?: string
): TI18nString => {
  if (typeof text === "object") {
    // It's already an i18n object, so clone it
    const i18nString: TI18nString = structuredClone(text);
    // Add new language keys with empty strings if they don't exist
    languages?.forEach((language) => {
      if (!(language in i18nString)) {
        i18nString[language] = "";
      }
    });

    // Remove language keys that are not in the languages array
    Object.keys(i18nString).forEach((key) => {
      if (key !== (targetLanguageCode ?? "default") && languages && !languages.includes(key)) {
        delete i18nString[key];
      }
    });

    return i18nString;
  } else {
    // It's a regular string, so create a new i18n object
    const i18nString = {
      [targetLanguageCode ?? "default"]: text,
    };

    // Initialize all provided languages with empty strings
    languages?.forEach((language) => {
      if (language !== (targetLanguageCode ?? "default")) {
        i18nString[language] = "";
      }
    });

    return i18nString;
  }
};

/**
 * Type guard that checks whether a value is a TI18nString (has a "default" key).
 *
 * @param obj — the value to check
 * @returns — true if it is an i18n object
 */
export const isI18nObject = (obj: unknown): obj is TI18nString => {
  return typeof obj === "object" && obj !== null && Object.keys(obj).includes("default");
};

/**
 * Checks whether an i18n label has a non-empty value in every required language.
 *
 * @param label — the i18n string to validate
 * @param languages — the language codes that must be filled
 * @returns — true if all languages have content
 */
export const isLabelValidForAllLanguages = (label: TI18nString, languages: string[]): boolean => {
  return languages.every((language) => label[language] && label[language].trim() !== "");
};

/**
 * Safely extracts a value from an i18n string for a given language, falling back to "".
 *
 * @param value — the i18n string (may be undefined)
 * @param languageId — the language code to read
 * @returns — the localised string, or ""
 */
export const getLocalizedValue = (value: TI18nString | undefined, languageId: string): string => {
  if (!value) {
    return "";
  }
  if (isI18nObject(value)) {
    if (value[languageId]) {
      return value[languageId];
    }
    return "";
  }
  return "";
};

/**
 * Extracts the language code for each survey language, using "default" for the default language.
 * Used when building i18n strings from a survey's language configuration.
 *
 * @param surveyLanguages — the survey's language associations
 * @returns — array of language codes
 */
export const extractLanguageCodes = (surveyLanguages: TSurveyLanguage[]): string[] => {
  if (!surveyLanguages) return [];
  return surveyLanguages.map((surveyLanguage) =>
    surveyLanguage.default ? "default" : surveyLanguage.language.code
  );
};

/**
 * Filters a survey's language associations to only those that are enabled.
 *
 * @param surveyLanguages — full list of survey-language associations
 * @returns — enabled languages only
 */
export const getEnabledLanguages = (surveyLanguages: TSurveyLanguage[]) => {
  return surveyLanguages.filter((surveyLanguage) => surveyLanguage.enabled);
};

/**
 * Extracts just the codes from a list of Language objects.
 *
 * @param languages — Language objects from Prisma
 * @returns — array of language codes
 */
export const extractLanguageIds = (languages: TLanguage[]): string[] => {
  return languages.map((language) => language.code);
};

/**
 * Resolves a language code from a response against the survey's language config.
 * If the code matches the default language (case-insensitive), "default" is returned.
 *
 * @param surveyLanguages — the survey's language associations
 * @param languageCode — the code from the response (may be null)
 * @returns — the resolved language code
 */
export const getLanguageCode = (surveyLanguages: TSurveyLanguage[], languageCode: string | null) => {
  if (!surveyLanguages?.length || !languageCode) return "default";
  const language = surveyLanguages.find(
    (surveyLanguage) => surveyLanguage.language.code.toLowerCase() === languageCode.toLowerCase()
  );
  return language?.default ? "default" : language?.language.code || "default";
};

export const iso639Identifiers = iso639Languages.map((language) => language.code);

/**
 * Recursively walks a survey/question object and ensures every `{ default: string, ... }`
 * i18n node has keys for all provided languages, adding empty strings for missing ones.
 * This prevents rendering `undefined` when a new language is added to a workspace.
 *
 * @param object — the survey or question object to migrate
 * @param languageSymbols — complete set of language codes to ensure
 * @returns — the mutated object (same reference)
 */
export const addMultiLanguageLabels = (object: unknown, languageSymbols: string[]): any => {
  // Helper function to add language keys to a multi-language object
  function addLanguageKeys(obj: { default: string; [key: string]: string }) {
    languageSymbols.forEach((lang) => {
      if (!obj.hasOwnProperty(lang)) {
        obj[lang] = ""; // Add empty string for new language keys
      }
    });
  }

  // Recursive function to process an object or array
  function processObject(obj: unknown) {
    if (Array.isArray(obj)) {
      obj.forEach((item) => processObject(item));
    } else if (obj && typeof obj === "object") {
      const record = obj as Record<string, unknown>;
      for (const key in record) {
        if (record.hasOwnProperty(key)) {
          if (key === "default" && typeof record[key] === "string") {
            addLanguageKeys(record as unknown as { default: string; [key: string]: string });
          } else {
            processObject(record[key]);
          }
        }
      }
    }
  }

  // Start processing the question object
  processObject(object);

  return object;
};

export const appLanguages = [
  {
    code: "de-DE",
    label: {
      "en-US": "German",
      native: "Deutsch",
    },
  },
  {
    code: "en-US",
    label: {
      "en-US": "English (US)",
      native: "English (US)",
    },
  },
  {
    code: "es-ES",
    label: {
      "en-US": "Spanish",
      native: "Español",
    },
  },
  {
    code: "fr-FR",
    label: {
      "en-US": "French",
      native: "Français",
    },
  },
  {
    code: "hu-HU",
    label: {
      "en-US": "Hungarian",
      native: "Magyar",
    },
  },
  {
    code: "ja-JP",
    label: {
      "en-US": "Japanese",
      native: "日本語",
    },
  },
  {
    code: "nl-NL",
    label: {
      "en-US": "Dutch",
      native: "Nederlands",
    },
  },
  {
    code: "pt-BR",
    label: {
      "en-US": "Portuguese (Brazil)",
      native: "Português (Brasil)",
    },
  },
  {
    code: "pt-PT",
    label: {
      "en-US": "Portuguese (Portugal)",
      native: "Português (Portugal)",
    },
  },
  {
    code: "ro-RO",
    label: {
      "en-US": "Romanian",
      native: "Română",
    },
  },
  {
    code: "ru-RU",
    label: {
      "en-US": "Russian",
      native: "Русский",
    },
  },
  {
    code: "sv-SE",
    label: {
      "en-US": "Swedish",
      native: "Svenska",
    },
  },
  {
    code: "tr-TR",
    label: {
      "en-US": "Turkish",
      native: "Türkçe",
    },
  },
  {
    code: "zh-Hans-CN",
    label: {
      "en-US": "Chinese (Simplified)",
      native: "简体中文",
    },
  },
  {
    code: "zh-Hant-TW",
    label: {
      "en-US": "Chinese (Traditional)",
      native: "繁體中文",
    },
  },
];

export const sortedAppLanguages = [...appLanguages].sort((a, b) =>
  a.label["en-US"].localeCompare(b.label["en-US"])
);
