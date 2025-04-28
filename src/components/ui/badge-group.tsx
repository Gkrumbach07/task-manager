"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Using Button for the toggle

type BadgeGroupProps = {
  labels: string[];
  initialLimit?: number;
  className?: string;
};

export function BadgeGroup({
  labels,
  initialLimit = 3, // Default to showing 3 badges initially
  className,
}: BadgeGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!labels || labels.length === 0) {
    return null; // Don't render anything if there are no labels
  }

  const visibleLabels = isExpanded ? labels : labels.slice(0, initialLimit);
  const hiddenCount = labels.length - visibleLabels.length;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className || ""}`}>
      {visibleLabels.map((label) => (
        <Badge key={label} variant="secondary">
          {label}
        </Badge>
      ))}
      {hiddenCount > 0 && !isExpanded && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 py-0 text-xs font-normal"
          onClick={() => setIsExpanded(true)}
        >
          +{hiddenCount} more
        </Button>
      )}
      {isExpanded && labels.length > initialLimit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 py-0 text-xs font-normal"
          onClick={() => setIsExpanded(false)}
        >
          Show less
        </Button>
      )}
    </div>
  );
}
