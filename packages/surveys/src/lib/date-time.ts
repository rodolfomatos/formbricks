/** Date-time utilities — validates date string formats (YYYY-MM-DD or DD-MM-YYYY) and formats dates with ordinal suffixes for display in surveys. */
export const isValidDateString = (value: string) => {
  const regex = /^(?:\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})$/;

  if (!regex.test(value)) {
    return false;
  }

  if (RegExp(/^\d{2}-\d{2}-\d{4}$/).exec(value) !== null) {
    value = value.replace(/(\d{2})-(\d{2})-(\d{4})/, "$3-$2-$1");
  }

  const date = new Date(value);
  return !isNaN(date.getTime());
};

export const formatDateWithOrdinal = (date: Date, locale: string = "en-US"): string => {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};
