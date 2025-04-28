"use-client";

import {
  Loader2,
  RefreshCw,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { JiraJqlQueryDto } from "@/lib/jira-jql-queries/schemas";
import { searchIssuesByJql } from "@/lib/jira/services/queries";
import { JiraJqlQueriesModal } from "./jira-jql-queries-modal";
import { useToast } from "@/hooks/use-toast";
import {
  deleteJqlQuery,
  updateJqlQuery,
  updateMultipleJqlQueriesEnabledStatus,
} from "@/lib/jira-jql-queries/services/mutations";
import { getJqlQueries } from "@/lib/jira-jql-queries/services/queries";
import { useState, useEffect, useMemo, Dispatch, SetStateAction } from "react";
import { JiraIssueWithQuery, QueryStatus } from "./types";
import { getStatusColor, getStatusIcon } from "./utils";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function JiraQuerySection({
  setJiraSelectedIssues,
  setQueryStatusMap,
  queryStatusMap,
}: {
  setJiraSelectedIssues: Dispatch<SetStateAction<JiraIssueWithQuery[]>>;
  setQueryStatusMap: Dispatch<SetStateAction<Map<string, QueryStatus>>>;
  queryStatusMap: Map<string, QueryStatus>;
}) {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingQuery, setEditingQuery] = useState<JiraJqlQueryDto | null>(
    null
  );
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const { toast } = useToast();
  const [jiraIssues, setJiraIssues] = useState<JiraIssueWithQuery[]>([]);

  const [selectedQueryUpdateLoadingMap, setSelectedQueryUpdateLoadingMap] =
    useState<Map<string, boolean>>(new Map());

  const queryClient = useQueryClient();

  const {
    data: savedQueries = [],
    isLoading: isLoadingQueries,
    isError: isErrorLoadingQueries,
  } = useQuery<JiraJqlQueryDto[], Error>({
    queryKey: ["jqlQueries"],
    queryFn: getJqlQueries,
  });

  useEffect(() => {
    const existingQueryIds = new Set(savedQueries.map((q) => q.id));

    // Clean up queryStatusMap: remove entries for deleted queries
    setQueryStatusMap((prev) => {
      let mapChanged = false;
      const next = new Map(prev);
      prev.forEach((_, key) => {
        if (!existingQueryIds.has(key)) {
          next.delete(key);
          mapChanged = true;
        }
      });
      // Only return a new map reference if something actually changed
      return mapChanged ? next : prev;
    });
  }, [savedQueries, setQueryStatusMap]); // Only depends on the fetched list

  useEffect(() => {
    if (isErrorLoadingQueries) {
      console.error("Error fetching saved JQL queries:");
      toast({
        title: "Error",
        description: "Could not load saved JQL queries.",
        variant: "destructive",
      });
    }
  }, [isErrorLoadingQueries, toast]);

  useEffect(() => {
    setJiraSelectedIssues(
      jiraIssues.filter((issue) =>
        issue.fromJqlQuery.some((query) => query.enabled)
      )
    );
  }, [jiraIssues, setJiraSelectedIssues]);

  const loadQuery = async (
    query: JiraJqlQueryDto
  ): Promise<JiraIssueWithQuery[]> => {
    setQueryStatusMap((prev) =>
      new Map(prev).set(query.id, { status: "loading" })
    );

    try {
      const issues = await searchIssuesByJql(query.jql);
      setQueryStatusMap((prev) =>
        new Map(prev).set(query.id, {
          status: "loaded",
          issueCount: issues.length,
        })
      );
      return issues.map((issue) => ({
        ...issue,
        fromJqlQuery: [query],
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setQueryStatusMap((prev) =>
        new Map(prev).set(query.id, { status: "error", error: errorMsg })
      );
      throw error;
    }
  };

  const mergeIssuesWithQuery = (
    prevIssues: JiraIssueWithQuery[],
    newIssues: JiraIssueWithQuery[]
  ) => {
    const combinedIssuesMap = new Map<string, JiraIssueWithQuery>(
      prevIssues.map((issue) => [issue.id, issue])
    );

    newIssues.forEach((issue) => {
      const existingIssue = combinedIssuesMap.get(issue.id);

      const fromJqlQueryMap = new Map<string, JiraJqlQueryDto>(
        existingIssue?.fromJqlQuery.map((q) => [q.id, q]) ?? []
      );

      const query = issue.fromJqlQuery[0];
      fromJqlQueryMap.set(query.id, query);

      combinedIssuesMap.set(issue.id, {
        ...issue,
        fromJqlQuery: Array.from(fromJqlQueryMap.values()),
      });
    });

    return Array.from(combinedIssuesMap.values());
  };

  const handleLoadSingleQuery = async (query: JiraJqlQueryDto) => {
    const loadedIssues = await loadQuery(query);
    setJiraIssues((prev) => mergeIssuesWithQuery(prev, loadedIssues));
  };

  const handleLoadAllSelected = async () => {
    const selectedQueries = savedQueries.filter((q) => q.enabled);
    if (selectedQueries.length === 0) return;

    setQueryStatusMap((prev) => {
      const next = new Map(prev);
      selectedQueries.forEach((q) => next.set(q.id, { status: "loading" }));
      return next;
    });
    setJiraIssues([]);

    const queryPromises = selectedQueries.map(async (query) => {
      const loadedIssues = await loadQuery(query);
      setJiraIssues((prev) => mergeIssuesWithQuery(prev, loadedIssues));
      return loadedIssues.length;
    });

    const results = await Promise.allSettled(queryPromises);
    const totalJirasLoaded = results.reduce(
      (prev, cur) => (cur.status === "fulfilled" ? prev + cur.value : prev),
      0
    );

    if (totalJirasLoaded === 0 && selectedQueries.length > 0) {
      toast({
        title: "No Issues Found",
        description:
          "No issues found for the selected queries, or all loads failed.",
        variant: "default",
      });
    }
  };

  const { selectedCount, loadedCount, errorCount, isLoadingAnySelected } =
    useMemo(() => {
      let selected = 0;
      let loaded = 0;
      let errors = 0;
      let loadingSelected = false;
      savedQueries.forEach((query) => {
        selected += query.enabled ? 1 : 0;
        const status = queryStatusMap.get(query.id);
        if (status?.status === "loaded") loaded++;
        if (status?.status === "error") errors++;
        if (status?.status === "loading") loadingSelected = true;
      });
      return {
        selectedCount: selected,
        loadedCount: loaded,
        errorCount: errors,
        isLoadingAnySelected: loadingSelected,
      };
    }, [queryStatusMap, savedQueries]);

  const handleQuerySuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["jqlQueries"] });
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsSettingsModalOpen(open);
    if (!open) {
      setEditingQuery(null);
    }
  };
  const handleSelectionChange = async (
    queryId: string,
    checked: boolean | "indeterminate"
  ) => {
    setSelectedQueryUpdateLoadingMap((prev) =>
      new Map(prev).set(queryId, true)
    );
    await updateJqlQuery({ id: queryId, enabled: checked === true });
    setSelectedQueryUpdateLoadingMap((prev) =>
      new Map(prev).set(queryId, false)
    );
    queryClient.invalidateQueries({ queryKey: ["jqlQueries"] });
  };

  const handleSelectAll = async (checked: boolean | "indeterminate") => {
    const targetEnabledState = checked === true;
    const idsToUpdate = savedQueries
      .filter((q) => q.enabled !== targetEnabledState)
      .map((q) => q.id);

    if (idsToUpdate.length === 0) return; // Nothing to do

    setSelectedQueryUpdateLoadingMap(
      new Map(idsToUpdate.map((id) => [id, true]))
    );

    try {
      await updateMultipleJqlQueriesEnabledStatus(
        idsToUpdate,
        targetEnabledState
      );
      // Success: Invalidation will update the UI
    } catch (error) {
      console.error("Error in handleSelectAll:", error);
      toast({
        title: "Error",
        description: `Failed to ${
          targetEnabledState ? "enable" : "disable"
        } all queries.`, // Added toast on error
        variant: "destructive",
      });
    } finally {
      // Clear loading state regardless of success/failure
      setSelectedQueryUpdateLoadingMap(new Map()); // Clear all, or only the ones attempted?
      queryClient.invalidateQueries({ queryKey: ["jqlQueries"] });
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    setQueryStatusMap((prev) => {
      const next = new Map(prev);
      next.delete(queryId);
      return next;
    });
    // invalidate queries
    queryClient.invalidateQueries({ queryKey: ["jqlQueries"] });

    try {
      const success = await deleteJqlQuery(queryId);
      if (success) {
        toast({ title: "Success", description: "JQL query deleted." });
        queryClient.invalidateQueries({ queryKey: ["jqlQueries"] });
      } else {
        throw new Error("Delete operation returned false.");
      }
    } catch (error) {
      console.error("Error deleting JQL query:", error);
      toast({
        title: "Error",
        description: "Failed to delete query.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["jqlQueries"] });
    }
  };

  const handleEditQuery = (query: JiraJqlQueryDto) => {
    setEditingQuery(query);
    setIsSettingsModalOpen(true);
  };

  const handleAddQuery = () => {
    setEditingQuery(null);
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
              <span
                className={cn(
                  "text-sm font-normal px-2 py-0.5 rounded",
                  errorCount > 0 && "bg-red-100 text-red-700",
                  errorCount === 0 &&
                    selectedCount > 0 &&
                    "bg-blue-100 text-blue-700",
                  errorCount === 0 &&
                    selectedCount === 0 &&
                    "bg-gray-100 text-gray-600"
                )}
              >
                {selectedCount} enabled
                {selectedCount > 0 && ` (${loadedCount} loaded`}
                {errorCount > 0 && `, ${errorCount} failed`}
                {selectedCount > 0 && `)`}
              </span>
              <Button
                size="sm"
                onClick={handleLoadAllSelected}
                disabled={
                  isLoadingAnySelected ||
                  selectedCount === 0 ||
                  isLoadingQueries
                }
                variant="outline"
                className="whitespace-nowrap"
              >
                {isLoadingAnySelected ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isLoadingAnySelected
                  ? "Loading..."
                  : loadedCount > 0 || errorCount > 0
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
            {isLoadingQueries ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : isErrorLoadingQueries ? (
              <p className="text-sm text-red-600 text-center py-4 px-4">
                Failed to load saved JQL queries. Please try again later.
              </p>
            ) : savedQueries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] px-2 text-center">
                      <Checkbox
                        checked={
                          savedQueries.length > 0 &&
                          savedQueries.every((query) => query.enabled)
                            ? true
                            : savedQueries.some((query) => query.enabled)
                            ? "indeterminate"
                            : false
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all queries"
                        disabled={
                          isLoadingQueries ||
                          Array.from(
                            selectedQueryUpdateLoadingMap.values()
                          ).some((loading) => loading)
                        }
                      />
                      <span className="sr-only">Select</span>
                    </TableHead>
                    <TableHead className="w-[30px] px-1 text-center">
                      <span className="sr-only">Status</span>
                    </TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>JQL</TableHead>
                    <TableHead className="w-[50px] text-center">
                      Issues
                    </TableHead>
                    <TableHead className="w-[120px] text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedQueries.map((query) => {
                    const status = queryStatusMap.get(query.id) ?? {
                      status: "idle",
                    };
                    const isQueryLoading = status.status === "loading";
                    return (
                      <TableRow
                        key={query.id}
                        data-state={query.enabled ? "selected" : undefined}
                      >
                        <TableCell className="px-2 text-center">
                          <Checkbox
                            checked={query.enabled}
                            onCheckedChange={(checked) =>
                              handleSelectionChange(query.id, checked)
                            }
                            disabled={
                              isLoadingAnySelected ||
                              isQueryLoading ||
                              selectedQueryUpdateLoadingMap.get(query.id)
                            }
                            aria-label={`Select query ${
                              query.label || query.id
                            }`}
                          />
                        </TableCell>
                        <TableCell
                          className={`px-1 text-center ${getStatusColor(
                            status.status
                          )}`}
                        >
                          {query.enabled && (
                            <Tooltip>
                              <TooltipTrigger>
                                {getStatusIcon(status.status)}
                              </TooltipTrigger>
                              <TooltipContent>
                                {status.status === "error"
                                  ? status.error
                                  : status.status.charAt(0).toUpperCase() +
                                    status.status.slice(1)}
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
                              <p className="max-w-md whitespace-pre-wrap">
                                {query.jql}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          {status.status === "loaded" ? (
                            status.issueCount
                          ) : query.enabled && status.status !== "loading" ? (
                            "..."
                          ) : status.status === "loading" ? (
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
                                  onClick={() => handleLoadSingleQuery(query)}
                                  disabled={
                                    isLoadingAnySelected ||
                                    isQueryLoading ||
                                    !query.enabled
                                  }
                                  aria-label={
                                    status.status === "loaded" ||
                                    status.status === "error"
                                      ? "Refresh query"
                                      : "Load query"
                                  }
                                  className="h-7 w-7"
                                >
                                  <RefreshCw
                                    className={cn(
                                      "h-4 w-4",
                                      isQueryLoading && "animate-spin"
                                    )}
                                  />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {status.status === "loaded" ||
                                status.status === "error"
                                  ? "Refresh"
                                  : "Load"}{" "}
                                Issues
                              </TooltipContent>
                            </Tooltip>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={
                                    isLoadingAnySelected || isQueryLoading
                                  }
                                  className="h-7 w-7"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Query Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditQuery(query)}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteQuery(query.id)}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
        <JiraJqlQueriesModal
          initialData={editingQuery}
          onSuccess={handleQuerySuccess}
          onOpenChange={handleModalOpenChange}
        />
      )}
    </TooltipProvider>
  );
}
