"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { JiraIssueTable } from "./jira-issue-table";
import { JiraQuerySection } from "./jira-query-section";
import { Skeleton } from "../ui/skeleton";
import { TaskDto } from "@/lib/tasks/schemas";
import { getTasksBySources } from "@/lib/tasks/services";
import { hideJiraIssue } from "@/lib/hidden-jiras-issues/services/mutations";
import { getHiddenJiraIssues } from "@/lib/hidden-jiras-issues/services/queries";

import { useJiraQueries } from "@/hooks/use-jira-queries";
import { Badge } from "../ui/badge";
import { Toggle } from "../ui/toggle";
import { markJiraIssueAsRead } from "@/lib/read-jiras-issues/services/mutations";
import { getReadJiraIssues } from "@/lib/read-jiras-issues/services/queries";

export function JiraExplorer() {
  const queryClient = useQueryClient();
  const [showLinkedIssues, setShowLinkedIssues] = useState(false);
  const [showReadIssues, setShowReadIssues] = useState(false);
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
    queryClient.invalidateQueries({ queryKey: ["hiddenJiraIssues"] });
  };

  const handleIssueRead = async (issueKey: string, lastReadUuid: string) => {
    await markJiraIssueAsRead(issueKey, lastReadUuid);
    queryClient.invalidateQueries({ queryKey: ["readJiraIssues"] });
  };

  const handleTaskCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["tasksBySource"] });
  };

  const visibleJiraIssues = useMemo(() => {
    const currentTaskMap = sourceToExistingTaskMap ?? new Map();
    const currentReadIssues = readJiraIssues ?? [];

    const isLoadingQueries = queries.some((q) => q.isExecuting);
    if (isLoadingQueries && jiras.length === 0) {
      return [];
    }

    return jiras
      .filter(
        (issue) =>
          !hiddenJiraIssueKeys.has(issue.key) &&
          (showLinkedIssues || !currentTaskMap.get(issue.key)) &&
          (showReadIssues ||
            !currentReadIssues.some(
              (readIssue) => readIssue.issueKey === issue.key
            ))
      )
      .sort(
        (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
      );
  }, [
    jiras,
    hiddenJiraIssueKeys,
    showLinkedIssues,
    sourceToExistingTaskMap,
    showReadIssues,
    readJiraIssues,
    queries,
  ]);

  const totalJirasBadgeText = useMemo(() => {
    const totalLinkedJiras = [
      ...(sourceToExistingTaskMap?.values() ?? []),
    ].filter((task) => task !== null).length;
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
    otherText = otherText ? `(${otherText})` : "";

    return `${visibleJiraIssues.length} visible ${otherText}`;
  }, [
    visibleJiraIssues.length,
    jiras,
    hiddenJiraIssueKeys,
    sourceToExistingTaskMap,
  ]);

  const isLoading = queries.some((q) => q.isExecuting);

  return (
    <div className="flex flex-col gap-4">
      <JiraQuerySection />
      <div className="space-y-3">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Jira Issues</h3>
            <Badge variant="outline">
              <span className="text-sm font-normal px-2 py-0.5 rounded">
                {isLoading && visibleJiraIssues.length === 0
                  ? "Loading..."
                  : totalJirasBadgeText}
              </span>
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Toggle
              pressed={showLinkedIssues}
              onPressedChange={setShowLinkedIssues}
              size="sm"
            >
              Show Linked
            </Toggle>
            <Toggle
              pressed={showReadIssues}
              onPressedChange={setShowReadIssues}
              size="sm"
            >
              Show Read
            </Toggle>
          </div>
        </div>

        {isLoading && visibleJiraIssues.length === 0 ? (
          <div className="rounded-md border p-4">
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <JiraIssueTable
            issues={visibleJiraIssues}
            existingTasksMap={sourceToExistingTaskMap ?? new Map()}
            readIssues={readJiraIssues ?? undefined}
            onIssueIgnored={handleIssueIgnored}
            onIssueRead={handleIssueRead}
            onTaskCreated={handleTaskCreated}
          />
        )}
      </div>
    </div>
  );
}
