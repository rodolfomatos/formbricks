import "server-only";
import { createId } from "@paralleldrive/cuid2";
import { logger } from "@formbricks/logger";
import {
  SAML_ACS_URL,
  SAML_AUDIENCE,
  SAML_IDP_ENTITY_ID,
  SAML_NAME_ID_FORMAT,
  SAML_PROTOCOL_BINDING,
  SAML_ATTRIBUTE_MAPPING,
} from "./constants";

export type SamlAuthnRequestResult = {
  samlRequest: string;
  relayState: string;
};

export type SamlUserProfile = {
  email: string;
  name?: string;
};

const escapeXml = (unsafe: string): string =>
  unsafe.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;"
  );

export const generateAuthnRequest = (
  callbackUrl?: string
): SamlAuthnRequestResult => {
  const requestId = `_${createId()}`;
  const issueInstant = new Date().toISOString();
  const relayState = callbackUrl ?? SAML_ACS_URL;

  const samlRequest = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<samlp:AuthnRequest',
    '  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"',
    '  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"',
    `  ID="${escapeXml(requestId)}"`,
    `  Version="2.0"`,
    `  IssueInstant="${escapeXml(issueInstant)}"`,
    `  ProtocolBinding="${escapeXml(SAML_PROTOCOL_BINDING)}"`,
    `  AssertionConsumerServiceURL="${escapeXml(SAML_ACS_URL)}"`,
    `  Destination="${SAML_IDP_ENTITY_ID ? escapeXml(SAML_IDP_ENTITY_ID) : ""}"`,
    ">",
    `  <saml:Issuer>${escapeXml(SAML_AUDIENCE)}</saml:Issuer>`,
    `  <samlp:NameIDPolicy`,
    `    Format="${escapeXml(SAML_NAME_ID_FORMAT)}"`,
    `    AllowCreate="true"`,
    `  />`,
    "</samlp:AuthnRequest>",
  ].join("\n");

  return { samlRequest, relayState };
};

type SamlElement = {
  tag: string;
  attributes: Record<string, string>;
  text: string;
  children: SamlElement[];
};

const parseSimpleXml = (xml: string): SamlElement[] => {
  const elements: SamlElement[] = [];
  const tagRegex = /<(\/?)([\w-:]+)((?:\s+[\w-:]+=(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
  let lastIndex = 0;
  const stack: SamlElement[] = [];

  const parseAttrs = (attrStr: string): Record<string, string> => {
    const attrs: Record<string, string> = {};
    const attrRegex = /([\w-:]+)="([^"]*)"/g;
    let match;
    while ((match = attrRegex.exec(attrStr)) !== null) {
      attrs[match[1]] = match[2];
    }
    return attrs;
  };

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(xml)) !== null) {
    const [, slash, tag, attrStr, selfClose] = match;
    if (slash === "/") {
      stack.pop();
    } else if (selfClose === "/") {
      elements.push({ tag, attributes: parseAttrs(attrStr), text: "", children: [] });
    } else {
      const elem: SamlElement = { tag, attributes: parseAttrs(attrStr), text: "", children: [] };
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(elem);
      } else {
        elements.push(elem);
      }
      stack.push(elem);
    }
    lastIndex = match.index + match[0].length;
  }

  return elements;
};

const extractTextContent = (xml: string, tagName: string): string | undefined => {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([^<]*)<\\/${tagName}>`);
  const match = regex.exec(xml);
  return match ? match[1] : undefined;
};

const extractAttributeValue = (xml: string, tagName: string, attrName: string): string | undefined => {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?\\s${attrName}="([^"]*)"`);
  const match = regex.exec(xml);
  return match ? match[1] : undefined;
};

export const parseSamlResponse = async (
  samlResponse: string,
  audience: string = SAML_AUDIENCE,
  cert?: string
): Promise<SamlUserProfile> => {
  const decoded = Buffer.from(samlResponse, "base64").toString("utf-8");

  logger.debug({ samlResponseXml: decoded.substring(0, 500) }, "Decoded SAML Response");

  const statusCode = extractAttributeValue(decoded, "samlp:StatusCode", "Value")
    ?? extractAttributeValue(decoded, "StatusCode", "Value");
  if (statusCode && !statusCode.endsWith("Success")) {
    throw new Error(`SAML authentication failed with status: ${statusCode}`);
  }

  const email =
    extractTextContent(decoded, "saml:NameID")
    ?? extractTextContent(decoded, "NameID");

  if (!email) {
    throw new Error("SAML Response does not contain a NameID");
  }

  const name =
    extractTextContent(decoded, "saml:AttributeValue")
    ?? extractTextContent(decoded, "AttributeValue");

  return { email, name };
};

export const validateSamlSignature = (_xml: string, _cert: string): boolean => {
  logger.warn("SAML XML signature validation is not implemented");
  return true;
};

export const SAML_ERROR_MESSAGES = {
  INVALID_RESPONSE: "The SAML response is invalid or malformed",
  MISSING_NAMEID: "The SAML response does not contain a NameID",
  STATUS_NOT_SUCCESS: "The SAML IdP returned a non-success status code",
  AUDIENCE_MISMATCH: "The SAML assertion audience does not match the expected value",
  SIGNATURE_INVALID: "The SAML response signature could not be validated",
} as const;
