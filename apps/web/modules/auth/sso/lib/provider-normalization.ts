import type { IdentityProvider } from "@formbricks/database/prisma";

/**
 * Canonical map from external OAuth provider identifiers to database values.
 * NextAuth's Azure AD driver normalises to "azure-ad" internally, but the Prisma
 * enum uses "azuread". Without this mapping, users signing in via Azure would
 * always be treated as "new" because the provider strings would never match.
 */
const SSO_PROVIDER_MAP = {
  google: "google",
  github: "github",
  "azure-ad": "azuread",
  azuread: "azuread",
  openid: "openid",
} as const satisfies Record<string, IdentityProvider>;

/**
 * Legacy provider strings used in Account rows before normalisation existed.
 * When an Account was created with "azure-ad" (from NextAuth's older driver),
 * the canonical lookup against "azuread" would miss it. These aliases let
 * the lookup iterate both old and new names.
 */
const LEGACY_SSO_PROVIDER_ALIASES: Partial<Record<IdentityProvider, string[]>> = {
  azuread: ["azure-ad"],
};

/**
 * Type guard that narrows a raw string to a known SSO provider key.
 * Keeps the null-handling logic in normalizeSsoProvider centralised instead of
 * duplicated in every caller that needs to validate a provider string.
 */
const isSupportedSsoProvider = (provider: string): provider is keyof typeof SSO_PROVIDER_MAP =>
  provider in SSO_PROVIDER_MAP;

/**
 * Normalises any supported provider string to the canonical IdentityProvider enum value.
 * Case-insensitive (lowercases input) to tolerate providers that vary casing
 * across different IdP implementations.
 *
 * @param provider - Raw provider string from NextAuth's Account or callback
 * @returns Canonical IdentityProvider, or null if the provider is unsupported
 *
 * @example
 * normalizeSsoProvider("azure-ad") // "azuread"
 * normalizeSsoProvider("OpenID")   // "openid"
 * normalizeSsoProvider("saml")     // null
 */
export const normalizeSsoProvider = (provider: string): IdentityProvider | null => {
  const normalizedProviderKey = provider.toLowerCase();
  if (!isSupportedSsoProvider(normalizedProviderKey)) {
    return null;
  }

  return SSO_PROVIDER_MAP[normalizedProviderKey];
};

/**
 * Returns the list of legacy provider IDs that should map to the given canonical provider.
 *
 * @param provider - Canonical IdentityProvider value
 * @returns Array of legacy provider strings (empty if none)
 *
 * @example
 * getLegacySsoProviderAliases("azuread") // ["azure-ad"]
 * getLegacySsoProviderAliases("google")  // []
 */
export const getLegacySsoProviderAliases = (provider: IdentityProvider): string[] =>
  LEGACY_SSO_PROVIDER_ALIASES[provider] ?? [];

/**
 * Builds the ordered list of provider IDs to try during Account lookup.
 * Canonical name comes first (matches newly created rows), followed by legacy
 * aliases (matches rows created before normalisation). Order matters because
 * Prisma's findUnique uses the first match.
 *
 * @param provider - Raw provider string (will be normalised internally)
 * @returns Array of provider strings to search, or [] if provider is unsupported
 *
 * @example
 * getSsoProviderLookupCandidates("azure-ad") // ["azuread", "azure-ad"]
 * getSsoProviderLookupCandidates("saml")     // []
 */
export const getSsoProviderLookupCandidates = (provider: string): string[] => {
  const normalizedProvider = normalizeSsoProvider(provider);

  if (!normalizedProvider) {
    return [];
  }

  return [normalizedProvider, ...getLegacySsoProviderAliases(normalizedProvider)];
};

/**
 * Like normalizeSsoProvider but never returns null — falls back to the raw input.
 * Useful where the caller wants a safe default for display or storage without
 * branching on null.
 *
 * @param provider - Raw provider string
 * @returns Canonical provider name, or the original string if unknown
 *
 * @example
 * resolveAccountProvider("azure-ad") // "azuread"
 * resolveAccountProvider("saml")     // "saml" (unchanged)
 */
export const resolveAccountProvider = (provider: string): string =>
  normalizeSsoProvider(provider) ?? provider;
