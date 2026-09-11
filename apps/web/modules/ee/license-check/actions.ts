"use server";

import { cache } from "react";
import { getEnterpriseLicense } from "./lib/license";

export const recheckLicenseAction = cache(async (_organizationId: string) => {
  return getEnterpriseLicense();
});
