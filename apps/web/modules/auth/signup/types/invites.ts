import { Invite, User } from "@formbricks/database/prisma";

/**
 * An invite row with the creator's profile details included.
 * Used after invite acceptance to send the "invite accepted" email
 * back to the person who created the invite.
 */
export interface InviteWithCreator extends Pick<Invite, "id" | "organizationId" | "role" | "teamIds"> {
  creator: Pick<User, "name" | "email" | "locale">;
}

/**
 * Minimum data from an invite needed to create organisation and team
 * memberships during sign-up flow. Does not include the invite ID or
 * creator info — those are consumed before membership creation.
 */
export interface CreateMembershipInvite extends Pick<Invite, "organizationId" | "role" | "teamIds"> {}
