/**
 * Checks whether a given string is a valid CSS selector by attempting
 * `element.querySelector()` in a detached element. Returns false for
 * empty/undefined inputs or invalid selectors.
 */
export const isValidCssSelector = (selector?: string) => {
  if (!selector || selector.length === 0) {
    return false;
  }
  const element = document.createElement("div");
  try {
    element.querySelector(selector);
  } catch (err) {
    return false;
  }
  return true;
};
