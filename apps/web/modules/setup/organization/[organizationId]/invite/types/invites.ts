import { z } from "zod";
import { ZInvite } from "@formbricks/database/zod/invites";
import { ZUserName } from "@formbricks/types/user";

/** Schema for a single invitee — name and email, with a validated user name. */
export const ZInvitee = ZInvite.pick({
  name: true,
  email: true,
}).extend({
  name: ZUserName,
});

export type TInvitee = z.infer<typeof ZInvitee>;

/** Schema for the invite-members form — a record of member entries keyed by a dynamic string index. */
export const ZInviteMembersFormSchema = z.record(
  z.string(),
  ZInvite.pick({
    email: true,
    name: true,
  }).extend({
    email: z.email("Invalid email address"),
    name: ZUserName,
  })
);

export type TInviteMembersFormSchema = z.infer<typeof ZInviteMembersFormSchema>;
