/**
 * Map an NPS option index (0-10) to a Tailwind colour token for the
 * email preview's colour-coded scale (red for detractors, green for promoters).
 *
 * @param idx — the 0-based NPS option index
 * @returns — a Tailwind colour token like "bg-rose-100"
 */
export const getNPSOptionColor = (idx: number): string => {
  if (idx > 8) return "bg-emerald-100";
  if (idx > 6) return "bg-orange-100";
  return "bg-rose-100";
};

/**
 * Map a numeric-rating option (1-based) to a colour token based on its
 * distance from the maximum. Used for colour-coded scales in email previews.
 *
 * @param range — the total scale range
 * @param idx — the 1-based option index
 * @returns — a colour token like "emerald-100"
 */
export const getRatingNumberOptionColor = (range: number, idx: number): string => {
  if (range > 5) {
    if (range - idx < 2) return "emerald-100";
    if (range - idx < 4) return "orange-100";
    return "rose-100";
  } else if (range < 5) {
    if (range - idx < 1) return "emerald-100";
    if (range - idx < 2) return "orange-100";
    return "rose-100";
  }
  if (range - idx < 2) return "emerald-100";
  if (range - idx < 3) return "orange-100";
  return "rose-100";
};

const defaultLocale = "en-US";

const getMessages = (locale: string): Record<string, string> => {
  const messages = require(`@/locales/${locale}.json`) as {
    emails: Record<string, string>;
  };
  return messages.emails;
};

/**
 * Translate an email text key for the given locale with optional
 * replacement variables.
 *
 * @param text — the i18n key
 * @param locale — the target locale
 * @param replacements — optional key-value pairs for template variable substitution
 * @returns — the translated string (falls back to the key itself)
 */
export const translateEmailText = (
  text: string,
  locale: string,
  replacements?: Record<string, string>
): string => {
  const messages = getMessages(locale || defaultLocale);
  let translatedText = messages[text] || text;

  if (replacements) {
    Object.entries(replacements).forEach(([key, value]) => {
      translatedText = translatedText.replace(new RegExp(`\\{${key}\\}`, "g"), value);
    });
  }

  return translatedText;
};
