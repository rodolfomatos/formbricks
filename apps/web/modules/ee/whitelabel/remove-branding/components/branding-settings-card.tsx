"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { TWorkspace } from "@formbricks/types/workspace";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { Switch } from "@/modules/ui/components/switch";
import { updateWorkspaceAction } from "@/modules/workspaces/settings/actions";

interface BrandingSettingsCardProps {
  canRemoveBranding: boolean;
  workspace: TWorkspace;
  isReadOnly: boolean;
}

export function BrandingSettingsCard({ canRemoveBranding, workspace, isReadOnly }: BrandingSettingsCardProps) {
  const { t } = useTranslation();
  const [linkSurveyBranding, setLinkSurveyBranding] = useState(workspace.linkSurveyBranding);

  const handleToggle = useCallback(
    async (enabled: boolean) => {
      const result = await updateWorkspaceAction({
        workspaceId: workspace.id,
        data: { linkSurveyBranding: enabled },
      });
      if (result?.data) {
        setLinkSurveyBranding(enabled);
        toast.success(t("workspace.look.branding_updated_successfully"));
      } else {
        const errorMessage = getFormattedErrorMessage(result);
        toast.error(errorMessage);
      }
    },
    [workspace.id, t]
  );

  const disabled = isReadOnly || !canRemoveBranding;

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-medium">{t("formbricks_branding")}</h3>
        <p className="text-xs text-slate-500">{t("formbricks_branding_settings_description")}</p>
      </div>
      <Switch checked={linkSurveyBranding} onCheckedChange={handleToggle} disabled={disabled} />
    </div>
  );
}
