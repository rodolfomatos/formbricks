import { z } from "zod";
import { ZId } from "@formbricks/types/common";
import { ZResponseInput } from "@formbricks/types/responses";

/** Zod schema for v2 response input: replaces userId with optional contactId and recaptchaToken. */
export const ZResponseInputV2 = ZResponseInput.omit({ userId: true }).extend({
  contactId: ZId.nullish(),
  recaptchaToken: z.string().nullish(),
});
export type TResponseInputV2 = z.infer<typeof ZResponseInputV2>;
