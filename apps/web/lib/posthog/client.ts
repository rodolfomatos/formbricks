"use client";

/**
 * Client-side PostHog helpers for feature flags.
 * Falls back to `false` if PostHog hasn't loaded yet.
 */
import posthog from "posthog-js";
import type { TPostHogFeatureFlagValue } from "./types";

/**
 * Evaluates a PostHog feature flag on the client side.
 * Returns `false` if PostHog.js hasn't finished loading, avoiding flicker.
 *
 * @param flagKey — the feature flag key
 * @returns — the flag value (boolean or string), or false
 */
export const getPostHogClientFeatureFlag = (flagKey: string): TPostHogFeatureFlagValue => {
  if (!posthog.__loaded) {
    return false;
  }

  const featureFlagValue = posthog.getFeatureFlag(flagKey);
  return featureFlagValue ?? false;
};

export type { TPostHogFeatureFlagContext, TPostHogFeatureFlagValue } from "./types";
