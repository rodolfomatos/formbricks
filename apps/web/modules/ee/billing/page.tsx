"use client";

import { useTranslation } from "react-i18next";

export function PricingPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">{t("billing")}</h1>
      <p className="text-slate-500">{t("billing_description")}</p>
    </div>
  );
}
