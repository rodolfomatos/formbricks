import { z } from "zod";
import { ZWebhook } from "@formbricks/database/zod/webhooks";

/** Zod schema for webhook creation/update input (name partially optional). */
export const ZWebhookInput = ZWebhook.partial({
  name: true,
  source: true,
  surveyIds: true,
}).pick({
  name: true,
  source: true,
  surveyIds: true,
  triggers: true,
  url: true,
  workspaceId: true,
});

export type TWebhookInput = z.infer<typeof ZWebhookInput>;
