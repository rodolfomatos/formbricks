import { AuthenticationError } from "@formbricks/types/errors";
import { AccountSecurity } from "@/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountSecurity";
import { DeleteAccount } from "@/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/DeleteAccount";
import { EditProfileDetailsForm } from "@/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/EditProfileDetailsForm";
import { SettingsCard } from "@/app/(app)/workspaces/[workspaceId]/settings/components/SettingsCard";
import {
  DISABLE_ACCOUNT_DELETION_SSO_CONFIRMATION,
  EMAIL_VERIFICATION_DISABLED,
  IS_FORMBRICKS_CLOUD,
  PASSWORD_RESET_DISABLED,
} from "@/lib/constants";
import { getOrganizationsWhereUserIsSingleOwner } from "@/lib/organization/service";
import { getUser } from "@/lib/user/service";
import { getTranslate } from "@/lingodotdev/server";
import { requiresPasswordConfirmationForAccountDeletion } from "@/modules/account/lib/account-deletion-auth";
import { IdBadge } from "@/modules/ui/components/id-badge";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";
import { PageHeader } from "@/modules/ui/components/page-header";
import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";

/**
 * Route: `/workspaces/[workspaceId]/settings/account/profile` (authenticated).
 * User profile settings: personal info, email change, language, password reset, 2FA, and account deletion.
 */
const Page = async (props: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ accountDeletionError?: string | string[] }>;
}) => {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const t = await getTranslate();
  const { session } = await getWorkspaceAuth(params.workspaceId);

  const organizationsWithSingleOwner = await getOrganizationsWhereUserIsSingleOwner(session.user.id);

  const user = session?.user ? await getUser(session.user.id) : null;

  if (!user) {
    throw new AuthenticationError(t("common.not_authenticated"));
  }

  const isPasswordResetEnabled = !PASSWORD_RESET_DISABLED && user.identityProvider === "email";
  const requiresPasswordConfirmation = requiresPasswordConfirmationForAccountDeletion(user);

  return (
    <PageContentWrapper>
      <PageHeader pageTitle={t("common.profile")} />
      {user && (
        <div>
          <SettingsCard
            title={t("workspace.settings.profile.personal_information")}
            description={t("workspace.settings.profile.update_personal_info")}>
            <EditProfileDetailsForm
              user={user}
              emailVerificationDisabled={EMAIL_VERIFICATION_DISABLED}
              isPasswordResetEnabled={isPasswordResetEnabled}
            />
          </SettingsCard>
          {user.identityProvider === "email" && (
            <SettingsCard
              title={t("common.security")}
              description={t("workspace.settings.profile.security_description")}>
              <AccountSecurity user={user} />
            </SettingsCard>
          )}

          <SettingsCard
            title={t("workspace.settings.profile.delete_account")}
            description={t("workspace.settings.profile.confirm_delete_account")}>
            <DeleteAccount
              session={session}
              IS_FORMBRICKS_CLOUD={IS_FORMBRICKS_CLOUD}
              user={user}
              organizationsWithSingleOwner={organizationsWithSingleOwner}
              isMultiOrgEnabled={true}
              accountDeletionError={searchParams.accountDeletionError}
              requiresPasswordConfirmation={requiresPasswordConfirmation}
              isSsoIdentityConfirmationDisabled={DISABLE_ACCOUNT_DELETION_SSO_CONFIRMATION}
            />
          </SettingsCard>
          <IdBadge id={user.id} label={t("common.profile_id")} variant="column" />
        </div>
      )}
    </PageContentWrapper>
  );
};

export default Page;
