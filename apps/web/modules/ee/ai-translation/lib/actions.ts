"use server";

export const checkAITranslationAvailableAction = async (): Promise<{ available: boolean; reason?: string }> => {
  return { available: false, reason: "AI translation requires an API key" };
};

export const translateSurveyFieldsAction = async (
  surveyId: string,
  targetLanguage: string
): Promise<{ success: boolean; error?: string }> => {
  return { success: false, error: "AI translation requires an API key" };
};
