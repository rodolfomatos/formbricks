/**
 * Billing usage cycle window calculation.
 *
 * Computes the start/end of the current billing period given an anchor date.
 * If no anchor is set, falls back to the calendar month. Used by the quota
 * and billing modules to determine what counts toward the current cycle.
 */
import { TOrganizationBilling } from "@formbricks/types/organizations";

type TBillingInput = Pick<TOrganizationBilling, "usageCycleAnchor">;

export type TUsageCycleWindow = {
  start: Date;
  end: Date;
};

const getUtcMonthDate = (
  year: number,
  monthIndex: number,
  anchorDay: number,
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number
): Date => {
  const lastDayOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const clampedDay = Math.min(anchorDay, lastDayOfMonth);

  return new Date(Date.UTC(year, monthIndex, clampedDay, hours, minutes, seconds, milliseconds));
};

const addUtcMonthsFromAnchor = (anchor: Date, monthOffset: number): Date => {
  const anchorYear = anchor.getUTCFullYear();
  const anchorMonth = anchor.getUTCMonth();
  const anchorDay = anchor.getUTCDate();
  const targetMonthIndex = anchorMonth + monthOffset;
  const targetYear = anchorYear + Math.floor(targetMonthIndex / 12);
  const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12;

  return getUtcMonthDate(
    targetYear,
    normalizedMonthIndex,
    anchorDay,
    anchor.getUTCHours(),
    anchor.getUTCMinutes(),
    anchor.getUTCSeconds(),
    anchor.getUTCMilliseconds()
  );
};

const getCalendarMonthWindow = (now: Date): TUsageCycleWindow => {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return { start, end };
};

/**
 * Computes the current monthly usage window based on the organisation's anchor date.
 * Walks forward/backward in month increments to find the period containing `now`.
 * Falls back to calendar month if anchor is null.
 *
 * @param usageCycleAnchor — the anchor date for the billing cycle
 * @param now — the reference "now" time
 * @returns — { start, end } of the current cycle window
 */
export const getMonthlyUsageCycleWindow = (
  usageCycleAnchor: Date | null,
  now = new Date()
): TUsageCycleWindow => {
  if (!usageCycleAnchor) {
    return getCalendarMonthWindow(now);
  }

  const anchor = new Date(usageCycleAnchor);

  let monthOffset =
    (now.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + (now.getUTCMonth() - anchor.getUTCMonth());

  let start = addUtcMonthsFromAnchor(anchor, monthOffset);

  while (start > now) {
    monthOffset -= 1;
    start = addUtcMonthsFromAnchor(anchor, monthOffset);
  }

  let end = addUtcMonthsFromAnchor(anchor, monthOffset + 1);

  while (end <= now) {
    monthOffset += 1;
    start = addUtcMonthsFromAnchor(anchor, monthOffset);
    end = addUtcMonthsFromAnchor(anchor, monthOffset + 1);
  }

  return { start, end };
};

/** Convenience wrapper: extracts `usageCycleAnchor` from the billing object and computes the window. */
export const getBillingUsageCycleWindow = (billing: TBillingInput, now = new Date()): TUsageCycleWindow => {
  return getMonthlyUsageCycleWindow(billing.usageCycleAnchor, now);
};
