"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { JiraCard } from "./jira-card";
import { JiraIssueWithQuery, QueryStatus } from "./types";
import { JiraQuerySection } from "./jira-query-section";
import { Skeleton } from "../ui/skeleton";
import { TaskDto } from "@/lib/tasks/schemas";
import { getTasksBySources } from "@/lib/tasks/services";
import { hideJiraIssue } from "@/lib/hidden-jiras-issues/services/mutations";
import { getHiddenJiraIssues } from "@/lib/hidden-jiras-issues/services/queries";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

export function JiraExplorer() {
  const queryClient = useQueryClient();
  const [jiraIssues, setJiraIssues] = useState<JiraIssueWithQuery[]>([]);
  const [queryStatusMap, setQueryStatusMap] = useState<
    Map<string, QueryStatus>
  >(new Map());
  const [showAlreadyLinkedIssues, setShowAlreadyLinkedIssues] = useState(false);

  const { data: hiddenJiraIssues } = useQuery({
    queryKey: ["hiddenJiraIssues"],
    queryFn: getHiddenJiraIssues,
  });

  const hiddenJiraIssueKeys = useMemo(() => {
    return new Set(hiddenJiraIssues?.map((issue) => issue.issueKey) ?? []);
  }, [hiddenJiraIssues]);

  const allSelectedSourceKeys = useMemo(
    () => jiraIssues.map((issue) => issue.key),
    [jiraIssues]
  );

  const { data: sourceToExistingTaskMap } = useQuery({
    queryKey: ["tasksBySource", allSelectedSourceKeys],
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

  const handleTaskCreated = async () => {
    // invalidate the query
    queryClient.invalidateQueries({ queryKey: ["tasksBySource"] });
  };

  const visibleJiraIssues = useMemo(() => {
    // Ensure sourceToExistingTaskMap is not undefined during initial render
    const currentTaskMap = sourceToExistingTaskMap ?? new Map();
    return jiraIssues.filter(
      (issue) =>
        !hiddenJiraIssueKeys.has(issue.key) &&
        (showAlreadyLinkedIssues || !currentTaskMap.get(issue.key))
    );
  }, [
    jiraIssues,
    hiddenJiraIssueKeys,
    sourceToExistingTaskMap, // Dependency added
    showAlreadyLinkedIssues,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <JiraQuerySection
        setJiraSelectedIssues={setJiraIssues}
        setQueryStatusMap={setQueryStatusMap}
        queryStatusMap={queryStatusMap}
      />
      <div className="space-y-3">
        <div className="flex items-center gap-2 justify-between">
          <h3 className="text-lg font-semibold">
            Jira Issues ({visibleJiraIssues.length})
          </h3>
          <div className="flex items-center gap-2">
            <Switch
              checked={showAlreadyLinkedIssues}
              onCheckedChange={setShowAlreadyLinkedIssues}
            />
            <Label>
              {showAlreadyLinkedIssues ? "Hide " : "Show "}
              already linked issues
            </Label>
          </div>
        </div>
        {visibleJiraIssues.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {visibleJiraIssues.map((issue) => {
              const isLoading = issue.fromJqlQuery.some(
                (query) => queryStatusMap.get(query.id)?.status === "loading"
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
