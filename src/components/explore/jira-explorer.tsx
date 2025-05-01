"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { JiraCard } from "./jira-card";
import { JiraQuerySection } from "./jira-query-section";
import { Skeleton } from "../ui/skeleton";
import { TaskDto } from "@/lib/tasks/schemas";
import { getTasksBySources } from "@/lib/tasks/services";
import { hideJiraIssue } from "@/lib/hidden-jiras-issues/services/mutations";
import { getHiddenJiraIssues } from "@/lib/hidden-jiras-issues/services/queries";

import { useJiraQueries } from "@/hooks/use-jira-queries";
import { Badge } from "../ui/badge";
import { JiraFieldFilter } from "./types";
import { JiraFilterBar } from "./jira-filter-bar";
import { markJiraIssueAsRead } from "@/lib/read-jiras-issues/services/mutations";
import { getReadJiraIssues } from "@/lib/read-jiras-issues/services/queries";
import { Toggle } from "../ui/toggle";
export function JiraExplorer() {
  const queryClient = useQueryClient();
  const [showLinkedIssues, setShowLinkedIssues] = useState(false);
  const [showReadIssues, setShowReadIssues] = useState(false);
  const [filters, setFilters] = useState<JiraFieldFilter[]>([]);
  const { jiras, queries } = useJiraQueries();

  const { data: hiddenJiraIssues } = useQuery({
    queryKey: ["hiddenJiraIssues"],
    queryFn: getHiddenJiraIssues,
  });

  const { data: readJiraIssues } = useQuery({
    queryKey: ["readJiraIssues"],
    queryFn: getReadJiraIssues,
  });

  const hiddenJiraIssueKeys = useMemo(() => {
    return new Set(hiddenJiraIssues?.map((issue) => issue.issueKey) ?? []);
  }, [hiddenJiraIssues]);

  const allSelectedSourceKeys = useMemo(
    () => jiras.map((issue) => issue.key),
    [jiras]
  );

  const { data: sourceToExistingTaskMap } = useQuery({
    queryKey: ["tasksBySource"],
    queryFn: async () => {
      if (allSelectedSourceKeys.length === 0) {
        return new Map<string, TaskDto | null>();
      }
      const tasks = await getTasksBySources(allSelectedSourceKeys);
      const taskSourceMapHelper = new Map<string, TaskDto>();
      tasks.forEach((task) => {
        if (task.source) {
          taskSourceMapHelper.set(task.source, task);
        }
      });

      // Ensure all keys from jiraIssues are present in the map
      const finalMap = new Map<string, TaskDto | null>();
      allSelectedSourceKeys.forEach((key) => {
        finalMap.set(key, taskSourceMapHelper.get(key) ?? null);
      });
      return finalMap;
    },
    enabled: allSelectedSourceKeys.length > 0, // Only run query if there are keys
    initialData: new Map<string, TaskDto | null>(), // Provide initial empty map
  });

  const handleIssueIgnored = async (issueKey: string) => {
    await hideJiraIssue(issueKey);
    // invalidate the query
    queryClient.invalidateQueries({ queryKey: ["hiddenJiraIssues"] });
  };

  const handleIssueRead = async (issueKey: string, lastReadUuid: string) => {
    await markJiraIssueAsRead(issueKey, lastReadUuid);
    // invalidate the query
    queryClient.invalidateQueries({ queryKey: ["readJiraIssues"] });
  };

  const handleTaskCreated = async () => {
    // invalidate the query
    queryClient.invalidateQueries({ queryKey: ["tasksBySource"] });
  };

  const handleFilterSelected = (filter: JiraFieldFilter) => {
    setFilters((prev) => [...prev, filter]);
  };

  const visibleJiraIssues = useMemo(() => {
    // Ensure sourceToExistingTaskMap is not undefined during initial render
    const currentTaskMap = sourceToExistingTaskMap ?? new Map();
    return jiras.filter(
      (issue) =>
        !hiddenJiraIssueKeys.has(issue.key) &&
        (showLinkedIssues || !currentTaskMap.get(issue.key)) &&
        (showReadIssues ||
          !readJiraIssues?.some(
            (readIssue) => readIssue.issueKey === issue.key
          )) &&
        filters.every((filter) => {
          if (filter.field === "labels") {
            return issue.labels.some((label) => label === filter.value);
          }
          const value = issue[filter.field];
          return value === filter.value;
        })
    );
  }, [
    sourceToExistingTaskMap,
    jiras,
    hiddenJiraIssueKeys,
    showLinkedIssues,
    showReadIssues,
    readJiraIssues,
    filters,
  ]);

  const totalJirasBadgeText = useMemo(() => {
    const totalLinkedJiras = Object.values(
      sourceToExistingTaskMap ?? {}
    ).filter((task) => {
      console.log(task);
      return task !== null;
    }).length;
    const isLinkedJiras = totalLinkedJiras > 0;

    const totalIgnoredFetched = jiras.filter((issue) =>
      hiddenJiraIssueKeys.has(issue.key)
    ).length;
    const isIgnoredJiras = totalIgnoredFetched > 0;

    let otherText = [
      isLinkedJiras && `${totalLinkedJiras} linked `,
      isIgnoredJiras && `${totalIgnoredFetched} ignored`,
    ]
      .filter(Boolean)
      .join(", ");
    otherText = `(${otherText})`;

    return `${visibleJiraIssues.length} visible ${
      isLinkedJiras || isIgnoredJiras ? otherText : ""
    }`;
  }, [
    visibleJiraIssues.length,
    jiras,
    hiddenJiraIssueKeys,
    sourceToExistingTaskMap,
  ]);
  return (
    <div className="flex flex-col gap-4">
      <JiraQuerySection />
      <div className="space-y-3">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Jira Issue</h3>
            <Badge variant="outline">
              <span className="ext-sm font-normal px-2 py-0.5 rounded">
                {totalJirasBadgeText}
              </span>
            </Badge>
          </div>
          <JiraFilterBar filters={filters} setFilters={setFilters} />
          <div className="flex items-center gap-2">
            <Toggle
              pressed={showLinkedIssues}
              onPressedChange={setShowLinkedIssues}
            >
              Show linked issues
            </Toggle>
            <Toggle
              pressed={showReadIssues}
              onPressedChange={setShowReadIssues}
            >
              Show read issues
            </Toggle>
          </div>
        </div>
        {visibleJiraIssues.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {visibleJiraIssues
              .sort((a, b) => {
                return (
                  new Date(b.updated).getTime() - new Date(a.updated).getTime()
                );
              })
              .map((issue) => {
                const isLoading = issue.fromJqlQuery.some(
                  (query) =>
                    queries.find((q) => q.query.id === query.id)?.isExecuting
                );
                if (isLoading) {
                  return (
                    <div className="flex flex-col space-y-3" key={issue.id}>
                      <Skeleton className="h-[300px] w-full rounded-xl" />
                    </div>
                  );
                }
                return (
                  <JiraCard
                    key={issue.id}
                    issue={issue}
                    fromJqlQueries={issue.fromJqlQuery}
                    existingTask={
                      sourceToExistingTaskMap?.get(issue.key) ?? undefined // Use optional chaining
                    }
                    onIssueIgnored={handleIssueIgnored}
                    onTaskCreated={handleTaskCreated}
                    onFilterSelected={handleFilterSelected}
                    onIssueRead={handleIssueRead}
                    isUnread={
                      !readJiraIssues?.some(
                        (readIssue) => readIssue.issueKey === issue.key
                      )
                    }
                  />
                );
              })}
          </div>
        ) : (
          <div className="text-center py-10 border rounded-lg bg-muted/40">
            <p className="text-muted-foreground">
              Load or refresh selected queries to see issues.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
