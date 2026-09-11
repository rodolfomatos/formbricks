"use client";

import { useMutation } from "@tanstack/react-query";
import { createSurveyFromTemplate } from "@/modules/survey/components/template-list/lib/v3-template-client";

/** Mutation hook that creates a survey from a template. Wraps createSurveyFromTemplate with React Query. */
export const useCreateSurveyFromTemplate = () => {
  return useMutation({
    mutationFn: createSurveyFromTemplate,
  });
};
