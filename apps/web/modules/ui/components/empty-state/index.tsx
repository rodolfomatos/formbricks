/**
 * Placeholder display for empty data views. Has two variants:
 * - "default": shows a skeleton-like placeholder with three blocks
 * - "simple": shows just a text message in a bordered box
 */
"use client";

interface EmptyStateProps {
  text: string;
  variant?: "default" | "simple";
}

export const EmptyState = ({ text, variant = "default" }: EmptyStateProps) => {
  if (variant === "simple") {
    return (
      <div className="shadow-xs rounded-xl border border-slate-100 bg-white p-4 text-center">
        <p className="text-sm text-slate-500">{text}</p>
      </div>
    );
  }

  return (
    <div className="shadow-xs rounded-xl border border-slate-100 bg-white p-4">
      <div className="w-full space-y-3">
        <div className="h-16 w-full rounded-lg bg-slate-50"></div>
        <div className="flex h-16 w-full flex-col items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
          {text}
        </div>
        <div className="h-16 w-full rounded-lg bg-slate-50"></div>
      </div>
    </div>
  );
};
