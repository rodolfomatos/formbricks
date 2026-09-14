"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/modules/ui/components/button";
import { EnableTwoFactorModal } from "./enable-two-factor-modal";
import { DisableTwoFactorModal } from "./disable-two-factor-modal";

interface TwoFactorProps {
  isTwoFactorEnabled: boolean;
}

export function TwoFactor({ isTwoFactorEnabled }: TwoFactorProps) {
  const { t } = useTranslation();
  const [enableModalOpen, setEnableModalOpen] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t("common.two_factor_auth")}</h3>
          <p className="text-sm text-slate-500">{t("common.two_factor_auth_description")}</p>
        </div>
        {isTwoFactorEnabled ? (
          <Button variant="destructive" onClick={() => setDisableModalOpen(true)}>
            {t("common.disable")}
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setEnableModalOpen(true)}>
            {t("common.enable")}
          </Button>
        )}
      </div>

      <EnableTwoFactorModal open={enableModalOpen} setOpen={setEnableModalOpen} />
      <DisableTwoFactorModal open={disableModalOpen} setOpen={setDisableModalOpen} />
    </div>
  );
}
