/**
 * OIDC profile fields that carry display-name components.
 * Used by the SSO module to construct a user display name from
 * standard OIDC claims when the top-level `name` claim is absent.
 */
export type TOidcNameFields = {
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
};

/**
 * SAML assertion name fields (kept for compatibility only).
 * SAML is not implemented in the AGPL fork; this type exists so that
 * callers that reference it do not produce type errors when porting
 * or referencing the EE module's interface.
 */
export type TSamlNameFields = {
  name?: string;
  firstName?: string;
  lastName?: string;
};
