import type { InfiniteData } from "@tanstack/react-query";
import { TSurveyListItem, TSurveyOverviewFilters } from "@/modules/survey/list/types/survey-overview";
import { TSurveyListPage } from "./v3-surveys-client";

type TSurveyListKeyInput = {
  workspaceId: string;
  limit: number;
  filters: TSurveyOverviewFilters;
};

/** React Query key factory for survey list data with filters. */
export const surveyKeys = {
  all: ["surveys"] as const,
  lists: () => [...surveyKeys.all, "list"] as const,
  list: (input: TSurveyListKeyInput) => [...surveyKeys.lists(), input] as const,
};

/** Flattens infinite query pages into a single array of survey items. */
export function flattenSurveyPages(data?: InfiniteData<TSurveyListPage>): TSurveyListItem[] {
  return data?.pages.flatMap((page) => page.data) ?? [];
}

/** Removes a survey by ID from infinite query cache data and decrements the total count. Returns undefined if the survey wasn't found. */
export function removeSurveyFromInfiniteData(
  data: InfiniteData<TSurveyListPage> | undefined,
  surveyId: string
): InfiniteData<TSurveyListPage> | undefined {
  if (!data) {
    return data;
  }

  let surveyWasRemoved = false;

  const pages = data.pages.map((page) => {
    const nextData = page.data.filter((survey) => survey.id !== surveyId);
    if (nextData.length !== page.data.length) {
      surveyWasRemoved = true;
    }

    return {
      ...page,
      data: nextData,
    };
  });

  if (!surveyWasRemoved) {
    return data;
  }

  return {
    ...data,
    pages: pages.map((page) => ({
      ...page,
      meta: {
        ...page.meta,
        totalCount: page.meta.totalCount === null ? null : Math.max(0, page.meta.totalCount - 1),
      },
    })),
  };
}
