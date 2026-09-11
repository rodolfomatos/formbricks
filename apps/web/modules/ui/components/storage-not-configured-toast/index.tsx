/**
 * Toast content shown when file storage is not configured or uploads are unavailable.
 * Links to the documentation for setting up file uploads.
 */
"use client";

import { useTranslation } from "react-i18next";

interface StorageNotConfiguredToastProps {
  variant?: "notConfigured" | "uploadUnavailable";
}

export const StorageNotConfiguredToast = ({
  variant = "notConfigured",
}: Readonly<StorageNotConfiguredToastProps>) => {
  const { t } = useTranslation();

  return (
    <span className="whitespace-normal text-slate-900">
      {variant === "uploadUnavailable"
        ? t("common.file_upload_service_unavailable")
        : t("common.file_storage_not_set_up")}{" "}
      <a
        className="whitespace-nowrap underline"
        href="https://formbricks.com/docs/self-hosting/configuration/file-uploads"
        target="_blank"
        rel="noopener noreferrer">
        {t("common.learn_more")}
      </a>
    </span>
  );
};
