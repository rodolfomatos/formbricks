/**
 * Calculates an ISO date string offset by the given number of days from now.
 *
 * @param expirationDays — Number of days until expiration
 * @returns — ISO date string
 */
export const calculateExpirationDate = (expirationDays: number) => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + expirationDays);
  return expirationDate.toISOString();
};
