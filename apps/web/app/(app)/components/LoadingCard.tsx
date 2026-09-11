import { SettingsCard } from "@/app/(app)/workspaces/[workspaceId]/settings/components/SettingsCard";
import { cn } from "@/lib/cn";

/**
 * Skeleton placeholder card used while settings pages are loading.
 * Renders a SettingsCard shell with animated pulse lines to indicate pending content.
 */
export const LoadingCard = ({
  title,
  description,
  skeletonLines,
}: {
  title: string;
  description: string;
  skeletonLines: Array<{ classes: string }>;
}) => {
  return (
    <SettingsCard title={title} description={description}>
      <div className="w-full space-y-4">
        {skeletonLines.map((line, index) => (
          <div key={index}>
            <div className={cn("animate-pulse rounded-full bg-slate-200", line.classes)}></div>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
};
