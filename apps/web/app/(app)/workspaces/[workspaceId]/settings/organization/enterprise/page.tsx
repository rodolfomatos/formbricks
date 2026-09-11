import { CheckCircleIcon } from "lucide-react";
import { getTranslate } from "@/lingodotdev/server";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";
import { PageHeader } from "@/modules/ui/components/page-header";
import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";

const FEATURES = [
  "hide_powered_by_formbricks",
  "whitelabel_email_follow_ups",
  "teams_and_access_roles",
  "contacts_and_segments",
  "quota_management",
  "feedback_directories",
  "insights_dashboards",
  "audit_logs",
  "oidc_sso",
  "saml_sso",
  "spam_protection_recaptcha",
  "two_factor_authentication",
  "custom_workspace_count",
  "ai_smart_tools",
];

const Page = async (props: Readonly<{ params: Promise<{ workspaceId: string }> }>) => {
  const params = await props.params;
  const t = await getTranslate();
  await getWorkspaceAuth(params.workspaceId);

  return (
    <PageContentWrapper>
      <PageHeader pageTitle="Available Features" />
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm text-slate-700">
          All features are available under the AGPLv3 license. No license key is required.
        </p>
      </div>
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900">Available Features</h2>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span>{t(`workspace.settings.enterprise.${feature}` as any)}</span>
            </div>
          ))}
        </div>
      </div>
    </PageContentWrapper>
  );
};

export default Page;
