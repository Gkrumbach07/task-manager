import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { JiraFieldFilter } from "./types";
import { JiraDto } from "@/lib/jira/schemas";

export function JiraFilterBar({
  filters,
  setFilters,
}: {
  filters: JiraFieldFilter[];
  setFilters: (filters: JiraFieldFilter[]) => void;
}) {
  if (filters.length === 0) {
    return null; // Don't render anything if there are no filters
  }

  // Helper to format the value for display
  const formatValue = (value: JiraFieldFilter): string => {
    const valueStr = String(value.value);
    const fieldStr = String(value.field);
    const displayField = fieldStr.charAt(0).toUpperCase() + fieldStr.slice(1);
    let displayValue = valueStr;

    if (value.field === "assignee") {
      const assignee = value.value as JiraDto["assignee"];
      displayValue = assignee?.displayName ?? valueStr;
    }

    return `${displayField}: ${displayValue}`;
  };

  const handleFilterRemoved = (filter: JiraFieldFilter) => {
    setFilters(filters.filter((f) => f !== filter));
  };

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm font-medium mr-2 self-center">Filters:</span>
      {filters.map((filter) => (
        <Badge
          key={`${filter.field}-${formatValue(filter)}`}
          variant="secondary"
          className="flex items-center gap-1 pl-2 pr-1 py-0.5"
        >
          <span className="text-xs font-semibold">{formatValue(filter)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 rounded-full"
            onClick={() => handleFilterRemoved(filter)}
            aria-label={`Remove filter ${filter.field}: ${formatValue(filter)}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}
