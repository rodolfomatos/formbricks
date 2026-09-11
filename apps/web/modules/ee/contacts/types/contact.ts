import { z } from "zod";
import { ZContact } from "@formbricks/database/zod/contact";

export type TContact = z.infer<typeof ZContact>;
