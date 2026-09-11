import { TContactAttributes } from "@formbricks/types/contact-attribute";
import { TResponseContact } from "@formbricks/types/responses";

/** Resolves the best display identifier for a response contact: email > userId > empty string. */
export const getContactIdentifier = (
  contact: TResponseContact | null,
  contactAttributes: TContactAttributes | null
): string => {
  return contactAttributes?.email || contact?.userId || "";
};
