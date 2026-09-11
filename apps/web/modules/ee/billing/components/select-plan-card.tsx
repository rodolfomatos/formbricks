"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/modules/ui/components/button";

interface SelectPlanCardProps {
  plan: string;
  price: number;
  onSelect: (plan: string) => void;
}

export function SelectPlanCard({ plan, price, onSelect }: SelectPlanCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-medium">{plan}</h3>
      <p className="mt-2 text-3xl font-bold">${price}</p>
      <Button className="mt-4" variant="primary" onClick={() => onSelect(plan)}>
        {t("select")}
      </Button>
    </div>
  );
}
