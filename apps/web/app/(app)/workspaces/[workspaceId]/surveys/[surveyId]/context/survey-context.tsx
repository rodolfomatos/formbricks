"use client";

import { createContext, useContext, useMemo } from "react";
import { TSurvey } from "@formbricks/types/surveys/types";

export interface SurveyContextType {
  survey: TSurvey;
}

const SurveyContext = createContext<SurveyContextType | null>(null);
SurveyContext.displayName = "SurveyContext";

/**
 * Returns the survey from context. Throws if used outside a SurveyContextWrapper.
 */
export const useSurvey = () => {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error("useSurvey must be used within a SurveyContextWrapper");
  }
  return context;
};

// Client wrapper component to be used in server components
interface SurveyContextWrapperProps {
  survey: TSurvey;
  children: React.ReactNode;
}

/**
 * Provider component that makes the current survey data available to the client component tree.
 * Memoizes the context value to prevent unnecessary re-renders.
 */
export const SurveyContextWrapper = ({ survey, children }: SurveyContextWrapperProps) => {
  const surveyContextValue = useMemo(
    () => ({
      survey,
    }),
    [survey]
  );

  return <SurveyContext.Provider value={surveyContextValue}>{children}</SurveyContext.Provider>;
};
