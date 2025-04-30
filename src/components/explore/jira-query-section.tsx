"use-client";

import { Loader2, RefreshCw, Plus } from "lucide-react";
import { TooltipProvider } from "../ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { JiraJqlQueriesModal } from "./jira-jql-queries-modal";
import { useState } from "react";
import { useJiraQueries } from "@/hooks/use-jira-queries";
import { ExecutionStatusBadge } from "./execution-status-badge";
import { QueryTable } from "./query-table";

export function JiraQuerySection() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);

  const {
    queries,
    isQueryLoading,
    isQueryError,
    queryError,
    executeAllJqlQueries,
    toggleAllJqlQueries,
  } = useJiraQueries();

  const handleModalOpenChange = (open: boolean) => {
    setIsSettingsModalOpen(open);
  };

  const handleAddQuery = () => {
    setIsSettingsModalOpen(true);
  };

  return (
    <TooltipProvider>
      <Accordion
        type="single"
        collapsible
        defaultValue="item-1"
        value={isAccordionOpen ? "item-1" : ""}
        onValueChange={(value: string) =>
          setIsAccordionOpen(value === "item-1")
        }
      >
        <AccordionItem
          value="item-1"
          className="border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
              <AccordionTrigger />
              <span className="text-lg font-semibold">Saved JQL Queries</span>
            </div>
            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
              <ExecutionStatusBadge
                success={queries.filter((r) => r.isExecuteSuccess).length}
                error={queries.filter((r) => r.isExecuteError).length}
                selected={queries.filter((r) => r.query.enabled).length}
              />
              <Button
                size="sm"
                onClick={executeAllJqlQueries}
                disabled={
                  queries.some((r) => r.isExecuting || r.isFetching) ||
                  queries.every((r) => !r.query.enabled)
                }
                variant="outline"
                className="whitespace-nowrap"
              >
                {queries.some((r) => r.isExecuting) ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {queries.some((r) => r.isExecuting)
                  ? "Loading..."
                  : queries.some((r) => r.isExecuteSuccess) ||
                    queries.some((r) => r.isExecuteError)
                  ? "Refresh enabled"
                  : "Fetch enabled"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddQuery}
                aria-label="Add Query"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <AccordionContent className="px-0 pt-0 pb-2">
            {isQueryLoading ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : isQueryError ? (
              <p className="text-sm text-red-600 text-center py-4 px-4">
                Failed to load saved JQL queries: {queryError?.message}
              </p>
            ) : queries.length > 0 ? (
              <QueryTable
                queries={queries}
                toggleAllJqlQueries={toggleAllJqlQueries}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 px-4">
                No saved JQL queries found. Click the add (+) icon to create
                one.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {isSettingsModalOpen && (
        <JiraJqlQueriesModal onOpenChange={handleModalOpenChange} />
      )}
    </TooltipProvider>
  );
}
