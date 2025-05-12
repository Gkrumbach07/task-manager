"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { JiraIssueTable } from "./jira-issue-table";
import { JiraQuerySection } from "./jira-query-section";
import { Skeleton } from "../ui/skeleton";
import { hideJiraIssue } from "@/lib/hidden-jiras-issues/services/mutations";
import { getHiddenJiraIssues } from "@/lib/hidden-jiras-issues/services/queries";
import { useJiraQueries } from "@/hooks/use-jira-queries";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  markJiraIssueAsRead,
  unmarkJiraIssueAsRead,
} from "@/lib/read-jiras-issues/services/mutations";
import { getReadJiraIssues } from "@/lib/read-jiras-issues/services/queries";
import { JiraIssueWithQuery } from "./types";

export function JiraExplorer() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showLinked, setShowLinked] = useState<boolean>(true);
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

  const handleNotionPageCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["notionPages"] });
  };

  const visibleJiraIssues = useMemo(() => {
    const currentReadIssues = readJiraIssues ?? [];
    const readIssueKeys = new Set(currentReadIssues.map((ri) => ri.issueKey));

    const isLoadingQueries = queries.some((q) => q.isExecuting);
    if (isLoadingQueries && jiras.length === 0) {
      return [];
    }

    let filtered: JiraIssueWithQuery[] = jiras.filter(
      (issue) => !hiddenJiraIssueKeys.has(issue.key)
    );

    if (activeTab === "unread") {
      filtered = filtered.filter((issue) => !readIssueKeys.has(issue.key));
    }

    if (!showLinked) {
      filtered = filtered.filter((issue) => !issue.notionPage);
    }

    return filtered.sort(
      (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
    );
  }, [
    jiras,
    hiddenJiraIssueKeys,
    readJiraIssues,
    queries,
    activeTab,
    showLinked,
  ]);

  const counts = useMemo(() => {
    const readIssueKeys = new Set(
      (readJiraIssues ?? []).map((ri) => ri.issueKey)
    );
    const baseVisible: JiraIssueWithQuery[] = jiras.filter(
      (issue) => !hiddenJiraIssueKeys.has(issue.key)
    );

    return {
      unread: baseVisible.filter((issue) => !readIssueKeys.has(issue.key))
        .length,
      all: baseVisible.length,
    };
  }, [jiras, hiddenJiraIssueKeys, readJiraIssues]);

  const isLoading = queries.some((q) => q.isExecuting);

  return (
    <div className="flex flex-col gap-4">
      <JiraQuerySection />
      <div className="space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center space-x-4">
            <TabsList className=" mb-2">
              <TabsTrigger value="all">
                All{" "}
                <Badge variant="secondary" className="ml-1">
                  {counts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread{" "}
                <Badge variant="secondary" className="ml-1">
                  {counts.unread}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2 mb-2 pl-1">
              <Checkbox
                id="show-linked"
                checked={showLinked}
                onCheckedChange={(checked) => setShowLinked(Boolean(checked))}
              />
              <Label htmlFor="show-linked" className="text-sm font-medium">
                Show issues linked to Notion
              </Label>
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
              readIssues={readJiraIssues ?? undefined}
              onIssueIgnored={handleIssueIgnored}
              onIssueRead={handleIssueRead}
              onIssueUnread={handleIssueUnread}
              onNotionPageCreated={handleNotionPageCreated}
            />
          )}
        </Tabs>
      </div>
    </div>
  );
}
