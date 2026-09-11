import { TSurvey } from "@formbricks/types/surveys/types";
import { updateSurveyInternal } from "@/lib/survey/service";

export { checkTriggersValidity, handleTriggerUpdates } from "@/modules/survey/lib/trigger-updates";

/** Saves survey changes as a draft (skips full validation so incomplete surveys can be edited). */
export const updateSurveyDraft = async (updatedSurvey: TSurvey): Promise<TSurvey> => {
  // Use the internal variant with validation disabled so drafts can remain incomplete while editing.
  return updateSurveyInternal(updatedSurvey, true);
};

/** Saves survey changes with full validation (used on publish). */
export const updateSurvey = async (updatedSurvey: TSurvey): Promise<TSurvey> => {
  return updateSurveyInternal(updatedSurvey);
};
