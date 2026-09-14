import { ResourceNotFoundError } from "@formbricks/types/errors";
import {
  DEFAULT_LOCALE,
  ENTERPRISE_LICENSE_REQUEST_FORM_URL,
  IS_FORMBRICKS_CLOUD,
  IS_STORAGE_CONFIGURED,
  MAIL_FROM,
  SURVEY_BG_COLORS,
  UNSPLASH_ACCESS_KEY,
} from "@/lib/constants";
import { getPublicDomain } from "@/lib/getPublicUrl";
import { getTranslate } from "@/lingodotdev/server";
import { getContactAttributeKeys } from "@/modules/ee/contacts/lib/contact-attribute-keys";
import { getSegments } from "@/modules/ee/contacts/segments/lib/segments";
import {
  getIsQuotasEnabled,
  getIsSpamProtectionEnabled,
} from "@/modules/ee/license-check/lib/utils";
import { getQuotas } from "@/modules/ee/quotas/lib/quotas";
import { getTeamMemberDetails } from "@/modules/survey/editor/lib/team";
import { getUserEmail } from "@/modules/survey/editor/lib/user";
import { getWorkspaceLanguages } from "@/modules/survey/editor/lib/workspace";
import { getActionClasses } from "@/modules/survey/lib/action-class";
import { getExternalUrlsPermission } from "@/modules/survey/lib/permission";
import { getResponseCountBySurveyId } from "@/modules/survey/lib/response";
import { getOrganizationBilling, getSurvey } from "@/modules/survey/lib/survey";
import { getWorkspaceWithTeamIds } from "@/modules/survey/lib/workspace";
import { ErrorComponent } from "@/modules/ui/components/error-component";
import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";
import { SurveyEditor } from "./components/survey-editor";
import { getUserLocale } from "./lib/user";

/** Generates the page title for the survey editor route based on the survey name. */
export const generateMetadata = async (props: { params: Promise<{ surveyId: string }> }) => {
  const params = await props.params;
  const survey = await getSurvey(params.surveyId);
  return {
    title: survey?.name ? `${survey?.name} | Editor` : "Editor",
  };
};

/** Server component for the survey editor route. Fetches all editor data (survey, workspace, action classes, segments, permissions) and renders the SurveyEditor client component. */
export const SurveyEditorPage = async (props: {
  params: Promise<{ workspaceId: string; surveyId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) => {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { session, isMember, hasReadAccess, currentUserMembership, workspacePermission, workspace } =
    await getWorkspaceAuth(params.workspaceId);

  const t = await getTranslate();

  const [survey, workspaceWithTeamIds, actionClasses, contactAttributeKeys, responseCount, segments] =
    await Promise.all([
      getSurvey(params.surveyId),
      getWorkspaceWithTeamIds(params.workspaceId),
      getActionClasses(workspace.id),
      getContactAttributeKeys(workspace.id),
      getResponseCountBySurveyId(params.surveyId),
      getSegments(workspace.id),
    ]);

  if (!workspaceWithTeamIds) {
    throw new ResourceNotFoundError(t("common.workspace"), null);
  }

  const organizationBilling = await getOrganizationBilling(workspaceWithTeamIds.organizationId);
  if (!organizationBilling) {
    throw new ResourceNotFoundError(t("common.organization"), workspaceWithTeamIds.organizationId);
  }

  const isSurveyCreationDeletionDisabled = isMember && hasReadAccess;
  const [locale, userEmail] = await Promise.all([
    getUserLocale(session.user.id),
    getUserEmail(session.user.id),
  ]);

  const [
    isSpamProtectionAllowed,
    isQuotasAllowed,
    isExternalUrlsAllowed,
  ] = await Promise.all([
    getIsSpamProtectionEnabled(workspaceWithTeamIds.organizationId),
    getIsQuotasEnabled(workspaceWithTeamIds.organizationId),
    getExternalUrlsPermission(workspaceWithTeamIds.organizationId),
  ]);

  const quotas = isQuotasAllowed && survey ? await getQuotas(survey.id) : [];
  const [workspaceLanguages, teamMemberDetails] = await Promise.all([
    getWorkspaceLanguages(workspaceWithTeamIds.id),
    getTeamMemberDetails(workspaceWithTeamIds.teamIds),
  ]);

  if (
    !survey ||
    !actionClasses ||
    !contactAttributeKeys ||
    !workspaceWithTeamIds ||
    !userEmail ||
    isSurveyCreationDeletionDisabled
  ) {
    return <ErrorComponent />;
  }

  const isCxMode = searchParams.mode === "cx";
  const publicDomain = getPublicDomain();

  return (
    <SurveyEditor
      survey={survey}
      workspace={workspaceWithTeamIds}
      actionClasses={actionClasses}
      contactAttributeKeys={contactAttributeKeys}
      responseCount={responseCount}
      membershipRole={currentUserMembership.role}
      workspacePermission={workspacePermission}
      colors={SURVEY_BG_COLORS}
      segments={segments}
      isSpamProtectionAllowed={isSpamProtectionAllowed}
      workspaceLanguages={workspaceLanguages}
      isFormbricksCloud={IS_FORMBRICKS_CLOUD}
      isUnsplashConfigured={!!UNSPLASH_ACCESS_KEY}
      isCxMode={isCxMode}
      locale={locale ?? DEFAULT_LOCALE}
      mailFrom={MAIL_FROM ?? "hola@formbricks.com"}
      userEmail={userEmail}
      teamMemberDetails={teamMemberDetails}
      isStorageConfigured={IS_STORAGE_CONFIGURED}
      isQuotasAllowed={isQuotasAllowed}
      quotas={quotas}
      isExternalUrlsAllowed={isExternalUrlsAllowed}
      publicDomain={publicDomain}
      enterpriseLicenseRequestFormUrl={ENTERPRISE_LICENSE_REQUEST_FORM_URL}
    />
  );
};
