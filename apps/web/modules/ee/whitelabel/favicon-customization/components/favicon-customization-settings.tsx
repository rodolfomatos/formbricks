"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { TOrganization } from "@formbricks/types/organizations";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { Button } from "@/modules/ui/components/button";
import { Input } from "@/modules/ui/components/input";
import { updateOrganizationWhitelabelAction } from "@/modules/ee/whitelabel/actions";

interface FaviconCustomizationSettingsProps {
  organization: TOrganization;
  hasWhiteLabelPermission: boolean;
  workspaceId: string;
  isReadOnly: boolean;
  isStorageConfigured: boolean;
}

export function FaviconCustomizationSettings({
  organization,
  hasWhiteLabelPermission,
  isReadOnly,
}: FaviconCustomizationSettingsProps) {
  const { t } = useTranslation();
  const [faviconUrl, setFaviconUrl] = useState(organization.whitelabel?.faviconUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const result = await updateOrganizationWhitelabelAction({
      organizationId: organization.id,
      whitelabel: { logoUrl: organization.whitelabel?.logoUrl ?? null, faviconUrl: faviconUrl || null },
    });
    if (result?.data) {
      toast.success(t("workspace.settings.domain.favicon_saved_successfully"));
    } else {
      const errorMessage = getFormattedErrorMessage(result);
      toast.error(errorMessage);
    }
    setIsSaving(false);
  }, [organization.id, organization.whitelabel?.logoUrl, faviconUrl, t]);

  const disabled = isReadOnly || !hasWhiteLabelPermission;

  return (
    <div className="relative my-4 w-full max-w-4xl rounded-xl border border-slate-200 bg-white py-4 text-left shadow-sm">
      <div className="flex justify-between border-b border-slate-200 px-4 pb-4">
        <div>
          <h4 className="text-lg font-medium tracking-normal">
            {t("workspace.settings.domain.favicon_customization")}
          </h4>
          <p className="mt-1 text-sm text-slate-500">
            {t("workspace.settings.domain.favicon_customization_description")}
          </p>
        </div>
      </div>
      <div className="space-y-4 px-4 pt-4">
        {faviconUrl && (
          <div className="flex items-center gap-4">
            <Image
              src={faviconUrl}
              alt="Favicon"
              width={32}
              height={32}
              className="h-8 w-8 rounded border object-contain p-0.5"
            />
          </div>
        )}
        <Input
          type="text"
          placeholder="https://example.com/favicon.ico"
          value={faviconUrl}
          onChange={(e) => setFaviconUrl(e.target.value)}
          disabled={disabled}
        />
        <Button type="button" size="sm" loading={isSaving} disabled={disabled} onClick={handleSave}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}
