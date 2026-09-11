import { TInvite } from "@/modules/organization/settings/teams/types/invites";

/** Checks whether an invite has passed its expiration date. */
export const isInviteExpired = (invite: TInvite) => {
  const now = new Date();
  const expiresAt = new Date(invite.expiresAt);
  return now > expiresAt;
};
