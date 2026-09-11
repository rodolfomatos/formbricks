"use client";

export function QuotasCard({ surveyId }: { surveyId: string }) {
  return <div className="rounded-lg border p-4">Quotas: {surveyId}</div>;
}
