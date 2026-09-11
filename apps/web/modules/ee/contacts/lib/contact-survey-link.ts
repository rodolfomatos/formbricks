import { WEBAPP_URL } from "@/lib/constants";

interface VerifyResult {
  ok: true;
  data: { surveyId: string; contactId: string };
}

interface ErrorResult {
  ok: false;
  error: { type: string; details?: Array<{ field: string; issue: string }> };
}

type Result = VerifyResult | ErrorResult;

export const verifyContactSurveyToken = (token: string): Result => {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    if (typeof decoded.surveyId === "string" && typeof decoded.contactId === "string") {
      return { ok: true, data: { surveyId: decoded.surveyId, contactId: decoded.contactId } };
    }
    return {
      ok: false,
      error: { type: "bad_request", details: [{ field: "token", issue: "invalid_token" }] },
    };
  } catch {
    return {
      ok: false,
      error: { type: "bad_request", details: [{ field: "token", issue: "invalid_token" }] },
    };
  }
};

export const getContactSurveyLink = async (
  contactId: string,
  surveyId: string,
  _expirationDays?: number
): Promise<{ ok: true; data: string } | { ok: false; error: { type: string } }> => {
  const token = Buffer.from(JSON.stringify({ surveyId, contactId })).toString("base64url");
  return { ok: true, data: `${WEBAPP_URL}/s/contact/${token}` };
};
