import type { Provider } from "next-auth/providers";

export const SamlProvider = (): Provider => ({
  id: "saml",
  name: "SAML SSO",
  type: "oauth" as const,
  authorization: {
    url: "/api/auth/saml/login",
  },
  clientId: "saml",
  clientSecret: "",
  profile(profile) {
    return {
      id: profile.sub ?? profile.id,
      email: profile.email,
      name: profile.name,
    };
  },
});
