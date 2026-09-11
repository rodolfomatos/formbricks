"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { TOrganization } from "@formbricks/types/organizations";
import { TUser } from "@formbricks/types/user";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { Button } from "@/modules/ui/components/button";
import { Input } from "@/modules/ui/components/input";
import { updateOrganizationWhitelabelAction } from "@/modules/ee/whitelabel/actions";

interface EmailCustomizationSettingsProps {
  organization: TOrganization;
  hasWhiteLabelPermission: boolean;
  workspaceId: string;
  isReadOnly: boolean;
  isFormbricksCloud: boolean;
  fbLogoUrl: string;
  user: TUser | null;
  isStorageConfigured: boolean;
  enterpriseLicenseRequestFormUrl: string;
}

export function EmailCustomizationSettings({
  organization,
  hasWhiteLabelPermission,
  isReadOnly,
}: EmailCustomizationSettingsProps) {
  const { t } = useTranslation();
  const [logoUrl, setLogoUrl] = useState(organization.whitelabel?.logoUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const result = await updateOrganizationWhitelabelAction({
      organizationId: organization.id,
      whitelabel: { logoUrl: logoUrl || null, faviconUrl: organization.whitelabel?.faviconUrl ?? null },
    });
    if (result?.data) {
      toast.success(t("workspace.look.logo_updated_successfully"));
    } else {
      const errorMessage = getFormattedErrorMessage(result);
      toast.error(errorMessage);
    }
    setIsSaving(false);
  }, [organization.id, organization.whitelabel?.faviconUrl, logoUrl, t]);

  const disabled = isReadOnly || !hasWhiteLabelPermission;

  return (
    <div className="relative my-4 w-full max-w-4xl rounded-xl border border-slate-200 bg-white py-4 text-left shadow-sm">
      <div className="flex justify-between border-b border-slate-200 px-4 pb-4">
        <div>
          <h4 className="text-lg font-medium tracking-normal">{t("workspace.look.email_customization")}</h4>
          <p className="mt-1 text-sm text-slate-500">
            {t("workspace.look.email_customization_description")}
          </p>
        </div>
      </div>
      <div className="space-y-4 px-4 pt-4">
        {logoUrl && (
          <div className="flex items-center gap-4">
            <Image
              src={logoUrl}
              alt="Email Logo"
              width={256}
              height={56}
              className="h-14 w-auto max-w-48 rounded border object-contain p-1"
            />
          </div>
        )}
        <Input
          type="text"
          placeholder="https://example.com/logo.png"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          disabled={disabled}
        />
        <Button type="button" size="sm" loading={isSaving} disabled={disabled} onClick={handleSave}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}
