/**
 * Legal links rendered in the email footer — privacy policy, terms of service,
 * imprint. All fields are optional so templates degrade gracefully when the
 * organisation hasn't configured these.
 */
export interface TEmailTemplateLegalProps {
  privacyUrl?: string;
  termsUrl?: string;
  imprintUrl?: string;
  imprintAddress?: string;
}
