/** Reasons why the organisation settings UI should prevent users from enabling AI features. */
export type TAIEnablementBlockReason = "instanceNotConfigured";

/** Describes whether the UI should allow the user to toggle AI features on/off. */
interface TOrganizationAIEnablementState {
  canEnableFeatures: boolean;
  blockReason?: TAIEnablementBlockReason;
}

/**
 * Computes the effective toggle value shown in the UI: AI is displayed as "on" only
 * when the instance is configured AND the org-level toggle is on.
 *
 * @param currentValue — the stored organisation-level setting
 * @param isInstanceConfigured — whether the instance has AI credentials
 * @returns — the effective boolean to show
 */
export const getDisplayedOrganizationAISettingValue = ({
  currentValue,
  isInstanceConfigured,
}: {
  currentValue: boolean;
  isInstanceConfigured: boolean;
}): boolean => isInstanceConfigured && currentValue;

/**
 * Determines whether the AI features toggle should be interactive in the settings UI.
 *
 * @param isInstanceConfigured — whether the instance has AI credentials
 * @returns — state object with `canEnableFeatures` and an optional blocking reason
 */
export const getOrganizationAIEnablementState = ({
  isInstanceConfigured,
}: {
  isInstanceConfigured: boolean;
}): TOrganizationAIEnablementState => {
  if (!isInstanceConfigured) {
    return {
      canEnableFeatures: false,
      blockReason: "instanceNotConfigured",
    };
  }

  return {
    canEnableFeatures: true,
  };
};
