"use client";

import { useState } from "react";
import type { TContactAttributeKey } from "@formbricks/types/contact-attribute-key";
import type { TSegment } from "@formbricks/types/segment";
import type { TSurvey } from "@formbricks/types/surveys/types";

interface TargetingCardProps {
  localSurvey: TSurvey;
  setLocalSurvey: (survey: TSurvey) => void;
  contactAttributeKeys: TContactAttributeKey[];
  segments: TSegment[];
  initialSegment?: TSegment;
}

export const TargetingCard = ({
  localSurvey,
  setLocalSurvey,
  contactAttributeKeys: _contactAttributeKeys,
  segments: _segments,
  initialSegment: _initialSegment,
}: TargetingCardProps) => {
  const [_isOpen, setIsOpen] = useState(false);

  const handleSegmentChange = (segmentId: string) => {
    const segment = _segments.find((s) => s.id === segmentId) ?? null;
    setLocalSurvey({
      ...localSurvey,
      segment,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-medium">Targeting</h3>
      <select
        className="w-full rounded-md border p-2"
        value={_initialSegment?.id ?? ""}
        onChange={(e) => handleSegmentChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}>
        <option value="">All contacts</option>
        {_segments.map((segment) => (
          <option key={segment.id} value={segment.id}>
            {segment.title}
          </option>
        ))}
      </select>
    </div>
  );
};
