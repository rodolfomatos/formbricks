"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/modules/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/ui/components/dialog";
import { disableTwoFactorAuth } from "../actions";

interface DisableTwoFactorModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function DisableTwoFactorModal({ open, setOpen }: Readonly<DisableTwoFactorModalProps>) {
  const { t } = useTranslation();
  const { data: sessionData, update } = useSession();
  const userId = sessionData?.user?.id ?? "";
  const [isLoading, setIsLoading] = useState(false);

  const handleDisable = useCallback(async () => {
    setIsLoading(true);
    await disableTwoFactorAuth(userId);
    await update();
    setIsLoading(false);
    setOpen(false);
  }, [update, setOpen, userId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("common.disable_two_factor_auth")}</DialogTitle>
          <DialogDescription>{t("common.disable_two_factor_auth_description")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDisable} loading={isLoading}>
            {t("common.disable")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
