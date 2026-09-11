import { z } from "zod";
import { ZId } from "@formbricks/types/common";
import { ZDisplayCreateInput } from "@formbricks/types/displays";

/** Zod schema for v2 display creation: replaces userId with optional contactId. */
export const ZDisplayCreateInputV2 = ZDisplayCreateInput.omit({ userId: true }).extend({
  contactId: ZId.optional(),
});

export type TDisplayCreateInputV2 = z.infer<typeof ZDisplayCreateInputV2>;
