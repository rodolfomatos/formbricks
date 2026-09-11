import { createTransport } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import {
  renderEmailCustomizationPreviewEmail,
  renderEmbedSurveyPreviewEmail,
  renderForgotPasswordEmail,
  renderInviteAcceptedEmail,
  renderInviteEmail,
  renderLinkSurveyEmail,
  renderNewEmailVerification,
  renderPasswordResetNotifyEmail,
  renderResponseFinishedEmail,
  renderVerificationEmail,
} from "@formbricks/email";
import { TEmailTemplateLegalProps } from "@formbricks/email/src/types/email";
import { logger } from "@formbricks/logger";
import type { TLinkSurveyEmailData } from "@formbricks/types/email";
import { InvalidInputError, ResourceNotFoundError } from "@formbricks/types/errors";
import type { TResponse } from "@formbricks/types/responses";
import { TSurveyElementTypeEnum } from "@formbricks/types/surveys/elements";
import type { TSurvey } from "@formbricks/types/surveys/types";
import { TUserEmail, TUserLocale } from "@formbricks/types/user";
import {
  DEBUG,
  IMPRINT_ADDRESS,
  IMPRINT_URL,
  MAIL_FROM,
  MAIL_FROM_NAME,
  PRIVACY_URL,
  SMTP_AUTHENTICATED,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_REJECT_UNAUTHORIZED_TLS,
  SMTP_SECURE_ENABLED,
  SMTP_USER,
  TERMS_URL,
  WEBAPP_URL,
} from "@/lib/constants";
import { getPublicDomain } from "@/lib/getPublicUrl";
import {
  createEmailChangeToken,
  createEmailToken,
  createInviteToken,
  createToken,
  createTokenForLinkSurvey,
} from "@/lib/jwt";
import { getOrganizationByWorkspaceId } from "@/lib/organization/service";
import { TElementResponseMappingSurvey, getElementResponseMapping } from "@/lib/responses";
import { getTranslate } from "@/lingodotdev/server";
import { TVerificationRequestPurpose, buildVerificationLinks } from "@/modules/auth/lib/verification-links";
import { resolveStorageUrl } from "@/modules/storage/utils";

/**
 * Whether the environment has SMTP credentials configured. All email-sending
 * functions gate on this flag to avoid crashing when no mail server is set up.
 */
export const IS_SMTP_CONFIGURED = Boolean(SMTP_HOST && SMTP_PORT);

const legalProps: TEmailTemplateLegalProps = {
  privacyUrl: PRIVACY_URL || undefined,
  termsUrl: TERMS_URL || undefined,
  imprintUrl: IMPRINT_URL || undefined,
  imprintAddress: IMPRINT_ADDRESS || undefined,
};

interface SendEmailDataProps {
  to: string;
  replyTo?: string;
  subject: string;
  text?: string;
  html: string;
}

export type TResponseFinishedEmailSurvey = TElementResponseMappingSurvey &
  Pick<TSurvey, "id" | "name" | "variables" | "hiddenFields">;

/**
 * Send an email through the configured SMTP transport. Skips silently when
 * SMTP is not configured so that callers don't need to check upfront.
 *
 * @param emailData — the email payload (to, subject, html, optional replyTo)
 * @returns — true if sent successfully, false if SMTP is unconfigured
 * @throws — InvalidInputError for incorrect SMTP credentials
 */
export const sendEmail = async (emailData: SendEmailDataProps): Promise<boolean> => {
  if (!IS_SMTP_CONFIGURED) {
    logger.info("SMTP is not configured, skipping email sending");
    return false;
  }
  try {
    const transporter = createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE_ENABLED, // true for 465, false for other ports
      ...(SMTP_AUTHENTICATED
        ? {
            auth: {
              type: "LOGIN",
              user: SMTP_USER,
              pass: SMTP_PASSWORD,
            },
          }
        : {}),
      tls: {
        rejectUnauthorized: SMTP_REJECT_UNAUTHORIZED_TLS,
      },
      logger: DEBUG,
      debug: DEBUG,
    } as SMTPTransport.Options);

    const emailDefaults = {
      from: `${MAIL_FROM_NAME ?? "Formbricks"} <${MAIL_FROM ?? "noreply@formbricks.com"}>`,
    };
    await transporter.sendMail({ ...emailDefaults, ...emailData });

    return true;
  } catch (error) {
    logger.error(error, "Error in sendEmail");
    throw new InvalidInputError("Incorrect SMTP credentials");
  }
};

/**
 * Send an email-change verification link to the new address.
 *
 * @param id — the user ID
 * @param email — the new email address to verify
 * @param locale — the user's locale for the email text
 * @returns — true if sent successfully
 */
export const sendVerificationNewEmail = async (
  id: string,
  email: string,
  locale: TUserLocale
): Promise<boolean> => {
  try {
    const t = await getTranslate(locale);
    const token = createEmailChangeToken(id, email);
    const verifyLink = `${WEBAPP_URL}/verify-email-change?token=${encodeURIComponent(token)}`;

    const html = await renderNewEmailVerification({ verifyLink, t, ...legalProps });

    return await sendEmail({
      to: email,
      subject: t("emails.verification_new_email_subject"),
      html,
    });
  } catch (error) {
    logger.error(error, "Error in sendVerificationNewEmail");
    throw error;
  }
};

/**
 * Send a generic verification email (sign-up, email change, etc.).
 *
 * @param id — the user ID
 * @param email — the recipient email
 * @param locale — locale for email text
 * @param callbackUrl — optional URL to redirect after verification
 * @param purpose — the type of verification
 * @returns — true if sent successfully
 */
export const sendVerificationEmail = async ({
  id,
  email,
  locale,
  callbackUrl,
  purpose = "email_verification",
}: {
  id: string;
  email: TUserEmail;
  locale: TUserLocale;
  callbackUrl?: string;
  purpose?: TVerificationRequestPurpose;
}): Promise<boolean> => {
  try {
    const t = await getTranslate(locale);
    const token = createToken(id, {
      expiresIn: "1d",
      purpose,
    });
    const { verifyLink, verificationRequestLink } = buildVerificationLinks({
      token,
      webAppUrl: WEBAPP_URL,
      callbackUrl,
      purpose,
      verificationRequestToken: createEmailToken(email),
    });

    const html = await renderVerificationEmail({
      verificationRequestLink,
      verifyLink,
      t,
      ...legalProps,
    });

    return await sendEmail({
      to: email,
      subject: t("emails.verification_email_subject"),
      html,
    });
  } catch (error) {
    logger.error(error, "Error in sendVerificationEmail");
    throw error; // Re-throw the error to maintain the original behavior
  }
};

/**
 * Send a password-reset email containing a time-limited link.
 *
 * @param user.email — the recipient email
 * @param user.locale — locale for the email text
 * @param user.verifyLink — the reset link
 * @param user.linkValidityInMinutes — how long the link is valid (shown in email)
 * @returns — true if sent successfully
 */
export const sendPasswordResetLinkEmail = async (user: {
  email: TUserEmail;
  locale: TUserLocale;
  verifyLink: string;
  linkValidityInMinutes: number;
}): Promise<boolean> => {
  const t = await getTranslate(user.locale);
  const html = await renderForgotPasswordEmail({
    verifyLink: user.verifyLink,
    linkValidityInMinutes: user.linkValidityInMinutes,
    t,
    ...legalProps,
  });
  return await sendEmail({
    to: user.email,
    subject: t("emails.forgot_password_email_subject"),
    html,
  });
};

/**
 * Notify a user that their password was changed (security best practice).
 *
 * @param user.email — the recipient email
 * @param user.locale — locale for the email text
 * @returns — true if sent successfully
 */
export const sendPasswordResetNotifyEmail = async (user: {
  email: string;
  locale: TUserLocale;
}): Promise<boolean> => {
  const t = await getTranslate(user.locale);
  const html = await renderPasswordResetNotifyEmail({ t, ...legalProps });
  return await sendEmail({
    to: user.email,
    subject: t("emails.password_reset_notify_email_subject"),
    html,
  });
};

/**
 * Send a workspace/organisation invitation email with a JWT-backed invite link.
 *
 * @param inviteId — the invite record ID
 * @param email — the invitee's email
 * @param inviterName — display name of the person who sent the invite
 * @param inviteeName — display name of the person being invited
 * @returns — true if sent successfully
 */
export const sendInviteMemberEmail = async (
  inviteId: string,
  email: string,
  inviterName: string,
  inviteeName: string
): Promise<boolean> => {
  const token = createInviteToken(inviteId, email, {
    expiresIn: "7d",
  });
  const t = await getTranslate();

  const verifyLink = `${WEBAPP_URL}/invite?token=${encodeURIComponent(token)}`;

  const html = await renderInviteEmail({ inviteeName, inviterName, verifyLink, t, ...legalProps });
  return await sendEmail({
    to: email,
    subject: t("emails.invite_member_email_subject"),
    html,
  });
};

/**
 * Notify the inviter that their invitation was accepted.
 *
 * @param inviterName — name of the person who sent the original invite
 * @param inviteeName — name of the person who accepted
 * @param email — the inviter's email
 * @param inviterLocale — locale for the notification text
 */
export const sendInviteAcceptedEmail = async (
  inviterName: string,
  inviteeName: string,
  email: string,
  inviterLocale?: TUserLocale
): Promise<void> => {
  const t = await getTranslate(inviterLocale);
  const html = await renderInviteAcceptedEmail({ inviteeName, inviterName, t, ...legalProps });
  await sendEmail({
    to: email,
    subject: t("emails.invite_accepted_email_subject"),
    html,
  });
};

/**
 * Notify watchers that a new survey response was submitted. Includes the
 * response data mapped to element names for human-readable context.
 *
 * @param email — the notification recipient
 * @param locale — locale for the email text
 * @param workspaceId — used to look up the organisation for branding
 * @param survey — the survey metadata
 * @param response — the submitted response
 * @param responseCount — total responses so far (for context)
 */
export const sendResponseFinishedEmail = async (
  email: string,
  locale: TUserLocale,
  workspaceId: string,
  survey: TResponseFinishedEmailSurvey,
  response: TResponse,
  responseCount: number
): Promise<void> => {
  const t = await getTranslate(locale);
  const personEmail = response.contactAttributes?.email;
  const organization = await getOrganizationByWorkspaceId(workspaceId);

  if (!organization) {
    throw new ResourceNotFoundError("Organization", null);
  }

  // Pre-process the element response mapping before passing to email
  const elements = getElementResponseMapping(survey, response);

  // Resolve relative storage URLs to absolute URLs for email rendering
  const elementsWithResolvedUrls = elements.map((element) => {
    if (
      (element.type === TSurveyElementTypeEnum.PictureSelection ||
        element.type === TSurveyElementTypeEnum.FileUpload) &&
      Array.isArray(element.response)
    ) {
      return {
        ...element,
        response: element.response.map((url) => resolveStorageUrl(url)),
      };
    }

    return element;
  });

  const html = await renderResponseFinishedEmail({
    survey,
    responseCount,
    response,
    WEBAPP_URL,
    workspaceId,
    organization,
    elements: elementsWithResolvedUrls,
    t,
    ...legalProps,
  });

  await sendEmail({
    to: email,
    subject: personEmail
      ? t("emails.response_finished_email_subject_with_email", {
          personEmail,
          surveyName: survey.name,
        })
      : t("emails.response_finished_email_subject", {
          surveyName: survey.name,
        }),
    replyTo: personEmail?.toString() ?? MAIL_FROM,
    html,
  });
};

/**
 * Send a preview of an embedded survey to the given email address so the
 * user can see how it renders in their inbox.
 *
 * @param to — recipient email
 * @param innerHtml — the rendered survey HTML (without wrapper)
 * @param workspaceId — used for branding resolution
 * @param locale — locale for the email wrapper text
 * @param logoUrl — optional workspace logo URL
 * @returns — true if sent successfully
 */
export const sendEmbedSurveyPreviewEmail = async (
  to: string,
  innerHtml: string,
  workspaceId: string,
  locale: TUserLocale,
  logoUrl?: string
): Promise<boolean> => {
  const t = await getTranslate(locale);
  // Resolve relative storage URLs to absolute URLs for email rendering
  const resolvedLogoUrl = logoUrl ? resolveStorageUrl(logoUrl) : undefined;
  const html = await renderEmbedSurveyPreviewEmail({
    html: innerHtml,
    workspaceId,
    logoUrl: resolvedLogoUrl,
    t,
    ...legalProps,
  });
  return await sendEmail({
    to,
    subject: t("emails.embed_survey_preview_email_subject"),
    html,
  });
};

/**
 * Send a preview of the email customisation settings (branding colours,
 * logo, etc.) so the user can verify their email template looks right.
 *
 * @param to — recipient email
 * @param userName — user's display name for the personalised greeting
 * @param locale — locale for the email text
 * @param logoUrl — optional custom logo URL
 * @returns — true if sent successfully
 */
export const sendEmailCustomizationPreviewEmail = async (
  to: string,
  userName: string,
  locale: TUserLocale,
  logoUrl?: string
): Promise<boolean> => {
  const t = await getTranslate(locale);
  // Resolve relative storage URLs to absolute URLs for email rendering
  const resolvedLogoUrl = logoUrl ? resolveStorageUrl(logoUrl) : undefined;
  const emailHtmlBody = await renderEmailCustomizationPreviewEmail({
    userName,
    logoUrl: resolvedLogoUrl,
    t,
    ...legalProps,
  });

  return await sendEmail({
    to,
    subject: t("emails.email_customization_preview_email_subject"),
    html: emailHtmlBody,
  });
};

/**
 * Send a link survey to a verified email address. Supports single-use
 * survey links with optional tokens for one-time access control.
 *
 * @param data — link survey email payload including survey ID, recipient email, and optional single-use params
 * @returns — true if sent successfully
 */
export const sendLinkSurveyToVerifiedEmail = async (data: TLinkSurveyEmailData): Promise<boolean> => {
  const surveyId = data.surveyId;
  const email = data.email;
  const surveyName = data.surveyName;
  const singleUseId = data.suId;
  const singleUseToken = data.suToken;
  // Resolve relative storage URLs to absolute URLs for email rendering
  const logoUrl = data.logoUrl ? resolveStorageUrl(data.logoUrl) : "";
  const token = createTokenForLinkSurvey(surveyId, email);
  const t = await getTranslate(data.locale);
  const getSurveyLink = (): string => {
    if (singleUseId) {
      const surveyLink = new URL(`${getPublicDomain()}/s/${surveyId}`);
      surveyLink.searchParams.set("verify", token);
      surveyLink.searchParams.set("suId", singleUseId);
      if (singleUseToken) {
        surveyLink.searchParams.set("suToken", singleUseToken);
      }
      return surveyLink.toString();
    }
    return `${getPublicDomain()}/s/${surveyId}?verify=${encodeURIComponent(token)}`;
  };
  const surveyLink = getSurveyLink();

  const html = await renderLinkSurveyEmail({ surveyName, surveyLink, logoUrl, t, ...legalProps });
  return await sendEmail({
    to: data.email,
    subject: t("emails.verified_link_survey_email_subject"),
    html,
  });
};
