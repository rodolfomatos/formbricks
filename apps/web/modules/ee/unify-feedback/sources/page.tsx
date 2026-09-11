"use client";

import { useTranslation } from "react-i18next";

export function WorkspaceFeedbackSourcesPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">{t("feedback_sources")}</h1>
      <p className="text-slate-500">{t("feedback_sources_description")}</p>
    </div>
  );
}
