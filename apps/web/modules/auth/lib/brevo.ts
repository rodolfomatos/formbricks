import { logger } from "@formbricks/logger";
import { ZId } from "@formbricks/types/common";
import { TUserEmail, ZUserEmail } from "@formbricks/types/user";
import { BREVO_API_KEY, BREVO_LIST_ID } from "@/lib/constants";
import { validateInputs } from "@/lib/utils/validate";

type BrevoCreateContact = {
  email?: string;
  ext_id?: string;
  attributes?: Record<string, string | string[]>;
  emailBlacklisted?: boolean;
  smsBlacklisted?: boolean;
  listIds?: number[];
  updateEnabled?: boolean;
  smtpBlacklistSender?: string[];
};

type BrevoUpdateContact = {
  attributes?: Record<string, string>;
  emailBlacklisted?: boolean;
  smsBlacklisted?: boolean;
  listIds?: number[];
  unlinkListIds?: number[];
  smtpBlacklistSender?: string[];
};

/**
 * Creates a contact in Brevo (formerly Sendinblue) CRM when a user verifies
 * their email. No-op if BREVO_API_KEY is not set — the integration is optional.
 * If BREVO_LIST_ID is configured, the contact is added to that list for marketing.
 *
 * Called from provisionNewSsoUser and the token provider's authorize callback
 * after email verification succeeds.
 *
 * @param id    - User ID (stored as ext_id for Brevo lookups)
 * @param email - User email
 */
export const createBrevoCustomer = async ({ id, email }: { id: string; email: TUserEmail }) => {
  if (!BREVO_API_KEY) {
    return;
  }

  validateInputs([id, ZId], [email, ZUserEmail]);

  try {
    const requestBody: BrevoCreateContact = {
      email,
      ext_id: id,
      updateEnabled: false,
    };

    const listId = BREVO_LIST_ID ? parseInt(BREVO_LIST_ID, 10) : null;
    if (listId && !Number.isNaN(listId)) {
      requestBody.listIds = [listId];
    }

    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (res.status !== 201) {
      const errorText = await res.text();
      logger.error({ errorText }, "Error sending user to Brevo");
    }
  } catch (error) {
    logger.error(error, "Error sending user to Brevo");
  }
};

/**
 * Updates a Brevo contact's email address. Used when a user changes their
 * email in the app so the CRM record stays in sync. Looks up the contact
 * by ext_id (the Formbricks user ID).
 *
 * @param id    - User ID (used as ext_id for Brevo lookup)
 * @param email - New email address
 */
export const updateBrevoCustomer = async ({ id, email }: { id: string; email: TUserEmail }) => {
  if (!BREVO_API_KEY) {
    return;
  }

  validateInputs([id, ZId], [email, ZUserEmail]);

  try {
    const requestBody: BrevoUpdateContact = {
      attributes: {
        EMAIL: email,
      },
    };

    const res = await fetch(`https://api.brevo.com/v3/contacts/${id}?identifierType=ext_id`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (res.status !== 204) {
      const errorText = await res.text();
      logger.error({ errorText }, "Error updating user in Brevo");
    }
  } catch (error) {
    logger.error(error, "Error updating user in Brevo");
  }
};

/**
 * Deletes a Brevo contact by email. Called when a user account is deleted
 * to keep the CRM in sync. The email is lowercased and URL-encoded for the
 * API request, matching Brevo's case-insensitive email handling.
 *
 * @param email - User email (identifies the contact in Brevo)
 */
export const deleteBrevoCustomerByEmail = async ({ email }: { email: TUserEmail }) => {
  if (!BREVO_API_KEY) {
    return;
  }

  const encodedEmail = encodeURIComponent(email.toLowerCase());

  try {
    const res = await fetch(`https://api.brevo.com/v3/contacts/${encodedEmail}?identifierType=email_id`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "api-key": BREVO_API_KEY,
      },
    });

    if (res.status !== 204) {
      const errorText = await res.text();
      logger.error({ errorText }, "Error deleting user from Brevo");
    }
  } catch (error) {
    logger.error(error, "Error deleting user from Brevo");
  }
};
