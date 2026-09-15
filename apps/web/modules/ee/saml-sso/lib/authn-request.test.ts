import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createSamlAuthnRequestRedirect } from "./authn-request";

const SAML_IDP_SSO_URL = "https://sso.idp.example.com/saml/sso";
const SAML_IDP_ENTITY_ID = "https://metadata.idp.example.com/metadata";
const SAML_ACS_URL = "https://app.example.com/api/auth/saml/callback";

vi.mock("./constants", () => ({
  SAML_IDP_SSO_URL,
  SAML_IDP_ENTITY_ID,
  SAML_ACS_URL,
}));

vi.mock("./saml-core", () => ({
  generateAuthnRequest: () => ({
    samlRequest: "<samlp:AuthnRequest/>",
    relayState: "relay-1",
  }),
}));

describe("createSamlAuthnRequestRedirect", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("redirects to SAML_IDP_SSO_URL even when SAML_IDP_ENTITY_ID is set to a different host (M-10)", async () => {
    const { createSamlAuthnRequestRedirect: freshRedirect } = await import("./authn-request");

    const redirectUrl = freshRedirect();
    const url = new URL(redirectUrl);

    expect(url.origin).toBe(new URL(SAML_IDP_SSO_URL).origin);
    expect(url.origin).not.toBe(new URL(SAML_IDP_ENTITY_ID).origin);
    expect(url.searchParams.get("SAMLRequest").length).toBeGreaterThan(0);
  });

  test("falls back to SAML_ACS_URL when SAML_IDP_SSO_URL is null", async () => {
    // simulate constants with no SSO URL
    vi.doMock("./constants", () => ({
      SAML_IDP_SSO_URL: null,
      SAML_IDP_ENTITY_ID,
      SAML_ACS_URL,
    }));
    vi.doMock("./saml-core", () => ({
      generateAuthnRequest: () => ({ samlRequest: "<samlp:AuthnRequest/>", relayState: "relay-2" }),
    }));

    const { createSamlAuthnRequestRedirect: fallbackRedirect } = await import("./authn-request");
    const url = new URL(fallbackRedirect());

    expect(url.origin).toBe(new URL(SAML_ACS_URL).origin);
  });
});
