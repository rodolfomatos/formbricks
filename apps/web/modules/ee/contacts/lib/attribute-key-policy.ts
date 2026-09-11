const RESERVED_FUTURE_KEYS = new Set(["userId", "email", "firstName", "lastName", "phone"]);

export const isReservedFutureDefaultAttributeKey = (key: string): boolean =>
  RESERVED_FUTURE_KEYS.has(key);

export const getReservedFutureDefaultAttributeKeyIssue = (keys: string[]): string =>
  `"${keys.join(", ")}" ${keys.length === 1 ? "is" : "are"} reserved for future use as default attribute keys. Please choose a different key.`;
