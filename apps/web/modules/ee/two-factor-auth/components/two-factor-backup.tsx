"use client";

import { useTranslation } from "react-i18next";

interface TwoFactorBackupProps {
  codes: string[];
}

export function TwoFactorBackup({ codes }: TwoFactorBackupProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-slate-500">{t("backup_codes_warning")}</p>
      <div className="rounded-lg bg-slate-50 p-4 font-mono text-sm space-y-1">
        {codes.map((code) => (
          <div key={code} className="tracking-wider">
            {code}
          </div>
        ))}
      </div>
    </div>
  );
}
