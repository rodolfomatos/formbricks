"use client";

import { useTranslation } from "react-i18next";

export function UnifyTopicsSubtopicsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">{t("topics_subtopics")}</h1>
      <p className="text-slate-500">{t("topics_subtopics_description")}</p>
    </div>
  );
}
