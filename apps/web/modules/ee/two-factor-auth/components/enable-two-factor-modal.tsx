"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Input } from "@/modules/ui/components/input";
import { Label } from "@/modules/ui/components/label";
import { enableTwoFactorAuth, finalizeTwoFactorSetup, verifyTwoFactorCode } from "../actions";
import { TwoFactorBackup } from "./two-factor-backup";

interface EnableTwoFactorModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function EnableTwoFactorModal({ open, setOpen }: Readonly<EnableTwoFactorModalProps>) {
  const { t } = useTranslation();
  const { data: sessionData, update } = useSession();
  const userId = sessionData?.user?.id ?? "";
  const [step, setStep] = useState<"qr" | "verify" | "backup">("qr");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setStep("qr");
      setCode("");
      setError("");
      enableTwoFactorAuth(userId).then((result) => {
        setSecret(result.secret);
        setQrCode(result.qrCode);
      });
    }
  }, [open, userId]);

  const handleVerify = useCallback(async () => {
    if (!code) return;
    const result = await verifyTwoFactorCode(userId, code);
    if (result.valid) {
      const backup = await finalizeTwoFactorSetup(userId);
      setBackupCodes(backup.backupCodes);
      setStep("backup");
    } else {
      setError(t("invalid_code"));
    }
  }, [code, t, userId]);

  const handleComplete = useCallback(async () => {
    await update();
    setOpen(false);
  }, [update, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        {step === "qr" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("enable_two_factor_auth")}</DialogTitle>
              <DialogDescription>{t("scan_qr_code")}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-4">
              <div className="h-48 w-48 bg-slate-100 flex items-center justify-center rounded-lg">
                <span className="text-sm text-slate-500">{t("qr_code_placeholder")}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button variant="primary" onClick={() => setStep("verify")}>
                {t("next")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "verify" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("verify_code")}</DialogTitle>
              <DialogDescription>
                {t("enter_the_code_from_your_authenticator_app")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <Label htmlFor="code">{t("code")}</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setStep("qr")}>
                {t("back")}
              </Button>
              <Button variant="primary" onClick={handleVerify}>
                {t("verify")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "backup" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("backup_codes")}</DialogTitle>
              <DialogDescription>{t("save_backup_codes")}</DialogDescription>
            </DialogHeader>
            <TwoFactorBackup codes={backupCodes} />
            <DialogFooter>
              <Button variant="primary" onClick={handleComplete}>
                {t("done")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
