/**
 * Barrel file for PostHog analytics utilities.
 * Re-exports everything callers need from a single entry point.
 */
import "server-only";

export { capturePostHogEvent, groupIdentifyPostHog } from "./capture";
export type { PostHogGroupContext } from "./capture";
export { getPostHogFeatureFlag } from "./get-feature-flag";
export type { TPostHogFeatureFlagContext, TPostHogFeatureFlagValue } from "./types";
