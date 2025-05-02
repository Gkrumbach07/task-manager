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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  markJiraIssueAsRead,
  unmarkJiraIssueAsRead,
} from "@/lib/read-jiras-issues/services/mutations";
import { getReadJiraIssues } from "@/lib/read-jiras-issues/services/queries";

export function JiraExplorer() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("active");
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

      const finalMap = new Map<string, TaskDto | null>();
      allSelectedSourceKeys.forEach((key) => {
        finalMap.set(key, taskSourceMapHelper.get(key) ?? null);
      });
      return finalMap;
    },
    enabled: allSelectedSourceKeys.length > 0,
    initialData: new Map<string, TaskDto | null>(),
  });

  const handleIssueIgnored = async (issueKey: string) => {
    await hideJiraIssue(issueKey);
    queryClient.invalidateQueries({ queryKey: ["hiddenJiraIssues"] });
  };

  const handleIssueRead = async (issueKey: string, lastReadUuid: string) => {
    await markJiraIssueAsRead(issueKey, lastReadUuid);
    queryClient.invalidateQueries({ queryKey: ["readJiraIssues"] });
  };

  const handleIssueUnread = async (issueKey: string) => {
    await unmarkJiraIssueAsRead(issueKey);
    queryClient.invalidateQueries({ queryKey: ["readJiraIssues"] });
  };

  const handleTaskCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["tasksBySource"] });
  };

  const visibleJiraIssues = useMemo(() => {
    const currentTaskMap = sourceToExistingTaskMap ?? new Map();
    const currentReadIssues = readJiraIssues ?? [];
    const readIssueKeys = new Set(currentReadIssues.map((ri) => ri.issueKey));

    const isLoadingQueries = queries.some((q) => q.isExecuting);
    if (isLoadingQueries && jiras.length === 0) {
      return [];
    }

    let filtered = jiras.filter((issue) => !hiddenJiraIssueKeys.has(issue.key));

    switch (activeTab) {
      case "unread":
        filtered = filtered.filter((issue) => !readIssueKeys.has(issue.key));
        break;
      case "tasks":
        filtered = filtered.filter((issue) => !!currentTaskMap.get(issue.key));
        break;
      default:
        break;
    }

    return filtered.sort(
      (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
    );
  }, [
    jiras,
    hiddenJiraIssueKeys,
    sourceToExistingTaskMap,
    readJiraIssues,
    queries,
    activeTab,
  ]);

  const counts = useMemo(() => {
    const currentTaskMap = sourceToExistingTaskMap ?? new Map();
    const readIssueKeys = new Set(
      (readJiraIssues ?? []).map((ri) => ri.issueKey)
    );
    const baseVisible = jiras.filter(
      (issue) => !hiddenJiraIssueKeys.has(issue.key)
    );

    return {
      active: baseVisible.filter(
        (issue) =>
          !currentTaskMap.get(issue.key) && !readIssueKeys.has(issue.key)
      ).length,
      unread: baseVisible.filter((issue) => !readIssueKeys.has(issue.key))
        .length,
      linked: baseVisible.filter((issue) => !!currentTaskMap.get(issue.key))
        .length,
      all: baseVisible.length,
    };
  }, [jiras, hiddenJiraIssueKeys, sourceToExistingTaskMap, readJiraIssues]);

  const isLoading = queries.some((q) => q.isExecuting);

  return (
    <div className="flex flex-col gap-4">
      <JiraQuerySection />
      <div className="space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className=" mb-2">
            <TabsTrigger value="all">
              All{" "}
              <Badge variant="secondary" className="">
                {counts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread{" "}
              <Badge variant="secondary" className="">
                {counts.unread}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tasks">
              Tasks{" "}
              <Badge variant="secondary" className="">
                {counts.linked}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
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
                onIssueUnread={handleIssueUnread}
                onTaskCreated={handleTaskCreated}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
