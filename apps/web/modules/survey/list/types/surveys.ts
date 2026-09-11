import { z } from "zod";
import { Language, Workspace } from "@formbricks/database/prisma";
import { ZSurveyStatus } from "@formbricks/types/surveys/types";

/** Zod schema and type for a survey record displayed in the survey list (includes response count and creator name). */
export const ZSurvey = z.object({
  id: z.string(),
  name: z.string(),
  workspaceId: z.string(),
  type: z.enum(["link", "app", "website", "web"]), //we can replace this with ZSurveyType after we remove "web" from schema
  status: ZSurveyStatus,
  publishOn: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  responseCount: z.number(),
  creator: z
    .object({
      name: z.string(),
    })
    .nullable(),
  singleUse: z
    .object({
      enabled: z.boolean(),
      isEncrypted: z.boolean(),
    })
    .nullable(),
});

export type TSurvey = z.infer<typeof ZSurvey>;

/** Workspace with its associated language codes and aliases for multi-language surveys. */
export interface TWorkspaceWithLanguages extends Pick<Workspace, "id"> {
  languages: Pick<Language, "code" | "alias">[];
}
