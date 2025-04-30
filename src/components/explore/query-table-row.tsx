import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { TableRow, TableCell } from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { JiraJqlQueryDto } from "@/lib/jira-jql-queries/schemas";
import { useState } from "react";
import { JiraJqlQueriesModal } from "./jira-jql-queries-modal";

export function QueryTableRow({
  query,
  toggleEnabled,
  isExecuting,
  isFetching,
  isExecuteSuccess,
  isExecuteError,
  isExecuteStale,
  executeError,
  issueCount,
  execute,
  handleDelete,
}: {
  query: JiraJqlQueryDto;
  toggleEnabled: (enabled: boolean) => void;
  isExecuting: boolean;
  isFetching: boolean;
  isExecuteSuccess: boolean;
  isExecuteError: boolean;
  isExecuteStale: boolean;
  executeError: Error | null;
  issueCount: number | null;
  execute: () => void;
  handleDelete: () => void;
}) {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleEditQuery = () => {
    setIsSettingsModalOpen(true);
  };

  return (
    <>
      <TableRow
        key={query.id}
        data-state={query.enabled ? "selected" : undefined}
      >
        <TableCell className="px-2 text-center">
          <Checkbox
            checked={query.enabled}
            onCheckedChange={(checked) => toggleEnabled(checked === true)}
            disabled={isExecuting || isFetching}
            aria-label={`Select query ${query.label || query.id}`}
          />
        </TableCell>
        <TableCell
          className={`px-1 text-center ${
            isExecuteStale
              ? "text-yellow-500"
              : isExecuteSuccess
              ? "text-green-500"
              : isExecuteError
              ? "text-red-500"
              : isExecuting
              ? "text-gray-400"
              : "text-gray-400"
          }`}
        >
          {query.enabled && (
            <Tooltip>
              <TooltipTrigger>
                {isExecuteStale ? (
                  <TriangleAlert className="h-4 w-4" />
                ) : isExecuteSuccess ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isExecuteError ? (
                  <XCircle className="h-4 w-4" />
                ) : isExecuting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {isExecuteStale
                  ? "Stale"
                  : isExecuteSuccess
                  ? "Success"
                  : isExecuteError
                  ? executeError?.message || "Error"
                  : isExecuting
                  ? "Executing"
                  : "Idle"}
              </TooltipContent>
            </Tooltip>
          )}
        </TableCell>
        <TableCell
          className={cn(
            "font-medium truncate max-w-[200px]",
            !query.enabled && "text-muted-foreground"
          )}
          title={query.label}
        >
          <div className="flex items-center gap-2">
            {query.labelColor && (
              <span
                className="inline-block h-3 w-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: query.labelColor }}
                aria-hidden="true"
              />
            )}
            <span className="truncate">{query.label}</span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground truncate max-w-[300px]">
          <Tooltip>
            <TooltipTrigger className="cursor-default text-left w-full truncate">
              {query.jql}
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-md whitespace-pre-wrap">{query.jql}</p>
            </TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell className="text-center">
          {isExecuteSuccess ? (
            issueCount ?? "-"
          ) : isExecuting ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => execute()}
                  disabled={isExecuting || isFetching || !query.enabled}
                  aria-label={
                    isExecuteSuccess || isExecuteError
                      ? "Refresh query"
                      : "Load query"
                  }
                  className="h-7 w-7"
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isExecuting && "animate-spin")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isExecuteSuccess || isExecuteError ? "Refresh" : "Load"} Issues
              </TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isExecuting || isFetching}
                  className="h-7 w-7"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Query Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditQuery}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete()}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      {isSettingsModalOpen && (
        <JiraJqlQueriesModal
          initialData={query}
          onOpenChange={setIsSettingsModalOpen}
        />
      )}
    </>
  );
}
