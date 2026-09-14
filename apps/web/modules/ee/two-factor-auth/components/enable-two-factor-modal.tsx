"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import QRCodeStyling from "qr-code-styling";
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
import { getQRCodeOptions } from "@/app/(app)/workspaces/[workspaceId]/surveys/[surveyId]/(analysis)/summary/lib/get-qr-code-options";
import { enableTwoFactorAuth, finalizeTwoFactorSetup, verifyTwoFactorCode } from "../actions";
import { TwoFactorBackup } from "./two-factor-backup";

interface EnableTwoFactorModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const QR_CODE_SIZE = 192;

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
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("qr");
    setCode("");
    setError("");
    enableTwoFactorAuth(userId).then((result) => {
      setSecret(result.secret);
      setQrCode(result.qrCode);
    });
  }, [open, userId]);

  useEffect(() => {
    if (!open || step !== "qr" || !qrCode) return;

    try {
      qrInstance.current ??= new QRCodeStyling(getQRCodeOptions(QR_CODE_SIZE, QR_CODE_SIZE));
      qrInstance.current.update({ data: qrCode });

      if (qrCodeRef.current) {
        qrCodeRef.current.innerHTML = "";
        qrInstance.current.append(qrCodeRef.current);
      }
    } catch {
      // The otpauth URI is the source of truth; the secret is rendered below as fallback.
      setQrCode("");
    }

    return () => {
      const instance = qrInstance.current;
      if (instance) {
        qrInstance.current = null;
      }
    };
  }, [open, step, qrCode]);

  const handleVerify = useCallback(async () => {
    if (!code) return;
    const result = await verifyTwoFactorCode(userId, code);
    if (result.valid) {
      const backup = await finalizeTwoFactorSetup(userId);
      setBackupCodes(backup.backupCodes);
      setStep("backup");
    } else {
      setError(t("common.invalid_code"));
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
              <DialogTitle>{t("common.enable_two_factor_auth")}</DialogTitle>
              <DialogDescription>{t("common.scan_qr_code")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 p-4">
              {qrCode ? (
                <div className="flex size-[192px] items-center justify-center rounded-lg border bg-white">
                  <div ref={qrCodeRef} className="h-full w-full" />
                </div>
              ) : (
                <div className="flex size-[192px] items-center justify-center rounded-lg border bg-slate-50 p-4">
                  <p className="text-center font-mono break-all text-xs text-slate-500">{secret}</p>
                </div>
              )}
              <div className="w-full rounded-lg bg-slate-50 p-3 text-center">
                <Label className="text-xs text-slate-500">{t("common.enter_secret_manually")}</Label>
                <p className="mt-1 font-mono break-all text-sm">{secret}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button variant="primary" onClick={() => setStep("verify")}>
                {t("common.next")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "verify" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("common.verify_code")}</DialogTitle>
              <DialogDescription>
                {t("common.enter_the_code_from_your_authenticator_app")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <Label htmlFor="code">{t("common.code")}</Label>
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
                {t("common.back")}
              </Button>
              <Button variant="primary" onClick={handleVerify}>
                {t("common.verify")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "backup" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("common.backup_codes")}</DialogTitle>
              <DialogDescription>{t("common.save_backup_codes")}</DialogDescription>
            </DialogHeader>
            <TwoFactorBackup codes={backupCodes} />
            <DialogFooter>
              <Button variant="primary" onClick={handleComplete}>
                {t("common.done")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}