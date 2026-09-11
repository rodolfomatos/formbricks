import { deleteSurvey as deleteSharedSurvey } from "@/modules/survey/lib/surveys";

/**
 * Delegates survey deletion to the shared module service.
 */
export const deleteSurvey = async (surveyId: string) => deleteSharedSurvey(surveyId);
