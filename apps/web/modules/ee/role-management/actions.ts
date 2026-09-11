"use server";

import { cache } from "react";

export const checkRoleManagementPermission = cache(async (_organizationId: string): Promise<void> => {
  return;
});
