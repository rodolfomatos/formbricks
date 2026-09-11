import { TOrganizationRole } from "@formbricks/types/memberships";

/**
 * Decomposes a role into boolean flags so template/component code can check
 * permissions with readable property access instead of repeated string comparison.
 *
 * @param role — the organisation role (owner, manager, billing, member)
 * @returns — an object with isOwner, isManager, isBilling, isMember booleans
 */
export const getAccessFlags = (role?: TOrganizationRole) => {
  const isOwner = role === "owner";
  const isManager = role === "manager";
  const isBilling = role === "billing";
  const isMember = role === "member";

  return {
    isManager,
    isOwner,
    isBilling,
    isMember,
  };
};

/**
 * Checks whether a user's role meets the minimum required level for user management.
 * "disabled" means no one can access; "owner" restricts to owners; "manager" allows
 * owners and managers.
 *
 * @param role — the user's current role
 * @param minimumRole — the minimum role configured for user management
 * @returns — true if the user has sufficient access
 */
export const getUserManagementAccess = (
  role: TOrganizationRole,
  minimumRole: "owner" | "manager" | "disabled"
): boolean => {
  // If minimum role is "disabled", no one has access
  if (minimumRole === "disabled") {
    return false;
  }
  if (minimumRole === "owner") {
    return role === "owner";
  }

  if (minimumRole === "manager") {
    return role === "owner" || role === "manager";
  }
  return false;
};
