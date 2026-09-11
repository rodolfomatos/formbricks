/** Path for the SSO re-authentication callback page used during account deletion. */
export const ACCOUNT_DELETION_SSO_REAUTH_CALLBACK_PATH = "/auth/account-deletion/sso/complete";
/** Query param name for signalling SSO re-authentication failure on the return URL. */
export const ACCOUNT_DELETION_SSO_REAUTH_ERROR_QUERY_PARAM = "accountDeletionError";
/** Internal error code returned when SSO re-authentication for account deletion fails. */
export const ACCOUNT_DELETION_SSO_REAUTH_FAILED_ERROR_CODE = "sso_reauth_failed";
/** Error code thrown when the caller must re-authenticate via SSO before deletion proceeds. */
export const ACCOUNT_DELETION_SSO_REAUTH_REQUIRED_ERROR_CODE = "sso_reauth_required";
/** Error code for when the typed confirmation email does not match the user's email. */
export const ACCOUNT_DELETION_EMAIL_MISMATCH_ERROR_CODE = "account_deletion_email_mismatch";
/** Error code for when required deletion confirmation inputs (email/password) are missing. */
export const ACCOUNT_DELETION_CONFIRMATION_REQUIRED_ERROR_CODE = "account_deletion_confirmation_required";
/** Post-deletion survey shown on Formbricks Cloud after account is deleted. */
export const FORMBRICKS_CLOUD_ACCOUNT_DELETION_SURVEY_URL =
  "https://app.formbricks.com/s/clri52y3z8f221225wjdhsoo2";

/** Error message returned when the password provided for account deletion is incorrect. */
export const DELETE_ACCOUNT_WRONG_PASSWORD_ERROR = "Wrong password";
