/**
 * A back button that navigates to a specific URL or invokes router.back().
 * Used in form headers and detail views.
 */
"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/modules/ui/components/button";

interface GoBackButtonProps {
  url?: string;
}

export const GoBackButton = ({ url }: Readonly<GoBackButtonProps>) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => {
        if (url) {
          router.push(url);
          return;
        }

        router.back();
      }}>
      <ArrowLeftIcon />
      {t("common.back")}
    </Button>
  );
};
