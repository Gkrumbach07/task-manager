"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink, Loader2, Check, Archive, Inbox } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import type { JiraDto } from "@/lib/jira/schemas";
import type { TaskDto, CreateTaskDto } from "@/lib/tasks/schemas";
import type { ReadJiraIssueDto } from "@/lib/read-jiras-issues/schemas";
import { JiraPriority } from "@/lib/jira/enums";
import { TaskPriority, TaskStatus } from "@/lib/tasks/enums";
import { createTask } from "@/lib/tasks/services/mutations";
import { JiraIssueWithQuery } from "./types";

// Helper functions (copied from jira-card.tsx, might need adjustments)
const mapJiraPriorityToTaskPriority = (
  jiraPriority: JiraPriority
): TaskPriority => {
  switch (jiraPriority) {
    case JiraPriority.BLOCKER:
    case JiraPriority.CRITICAL:
      return TaskPriority.CRITICAL;
    case JiraPriority.MAJOR:
      return TaskPriority.MAJOR;
    case JiraPriority.MINOR:
      return TaskPriority.MINOR;
    case JiraPriority.NORMAL:
    default:
      return TaskPriority.NORMAL;
  }
};

const jiraToCreateTaskDto = (issue: JiraDto): CreateTaskDto => ({
  title: issue.title,
  body: issue.description || null,
  dueDate: null,
  status: TaskStatus.BACKLOG,
  source: issue.key,
  priority: mapJiraPriorityToTaskPriority(issue.priority),
});

type JiraIssueTableProps = {
  issues: JiraIssueWithQuery[];
  existingTasksMap: Map<string, TaskDto | null>;
  readIssues: ReadJiraIssueDto[] | undefined;
  onIssueIgnored: (issueKey: string) => Promise<void>;
  onIssueRead: (issueKey: string, lastReadUuid: string) => Promise<void>;
  onTaskCreated: () => void;
};

export function JiraIssueTable({
  issues,
  existingTasksMap,
  readIssues,
  onIssueIgnored,
  onIssueRead,
  onTaskCreated,
}: JiraIssueTableProps) {
  const { toast } = useToast();

  // --- Mutation Hooks ---
  const { mutate: markIssueAsRead, variables: markingAsReadVars } = useMutation(
    {
      mutationFn: ({
        issueKey,
        updated,
      }: {
        issueKey: string;
        updated: string;
      }) => onIssueRead(issueKey, updated),
      onSuccess: (_, vars) => {
        toast({ title: `Marked ${vars.issueKey} as read.` });
      },
      onError: (error, vars) => {
        toast({
          title: `Error marking ${vars.issueKey} as read`,
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  const { mutate: ignoreIssue, variables: ignoringIssueVars } = useMutation({
    mutationFn: (issueKey: string) => onIssueIgnored(issueKey),
    onSuccess: (_, issueKey) => {
      toast({ title: `Archived ${issueKey}.` });
    },
    onError: (error, issueKey) => {
      toast({
        title: `Error archiving ${issueKey}`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: quickCreateTask, variables: quickCreatingVars } = useMutation(
    {
      mutationFn: (issue: JiraDto) => createTask(jiraToCreateTaskDto(issue)),
      onSuccess: (newTask) => {
        if (newTask) {
          toast({
            title: "Task Created",
            description: `Task '${newTask.title}' added to backlog.`,
          });
          onTaskCreated(); // Notify parent to refetch tasks
        } else {
          throw new Error("Failed to create task. API returned no data.");
        }
      },
      onError: (error) => {
        console.error("Error during quick create:", error);
        toast({
          title: "Error Creating Task",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred.",
          variant: "destructive",
        });
      },
    }
  );

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Key</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[120px]">Updated</TableHead>
              <TableHead className="text-right w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No issues found matching the criteria.
                </TableCell>
              </TableRow>
            )}
            {issues.map((issue) => {
              const existingTask = existingTasksMap.get(issue.key);
              const isRead = readIssues?.some(
                (ri) => ri.issueKey === issue.key
              );
              const isUnread = !isRead;
              const isIgnoring = ignoringIssueVars === issue.key;
              const isMarkingRead = markingAsReadVars?.issueKey === issue.key;
              const isQuickCreating = quickCreatingVars?.key === issue.key;
              const isBusy = isIgnoring || isMarkingRead || isQuickCreating;

              return (
                <TableRow
                  key={issue.key}
                  className={cn(
                    "group",
                    isUnread && "bg-primary/5 hover:bg-primary/10",
                    existingTask && "opacity-60"
                  )}
                >
                  <TableCell
                    className={cn("font-medium", isUnread && "font-semibold")}
                  >
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      {issue.key}
                      <ExternalLink className="inline-block h-3 w-3 text-muted-foreground" />
                    </a>
                  </TableCell>
                  <TableCell className="max-w-sm truncate" title={issue.title}>
                    <span className={cn(isUnread && "font-semibold")}>
                      {issue.title}
                    </span>
                    {issue.fromJqlQuery && issue.fromJqlQuery.length > 0 && (
                      <span className="ml-2 space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {issue.fromJqlQuery.length === 1 ? (
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-xs h-5"
                            style={{
                              backgroundColor:
                                issue.fromJqlQuery[0].labelColor ?? undefined,
                            }}
                          >
                            {issue.fromJqlQuery[0].label}
                          </Badge>
                        ) : (
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant="secondary"
                                  className="px-1.5 py-0 text-xs h-5"
                                >
                                  {issue.fromJqlQuery.length} sources
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {issue.fromJqlQuery
                                  .map((q) => q.label)
                                  .join(", ")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn("text-xs", isUnread && "font-semibold")}
                  >
                    {formatDistanceToNow(new Date(issue.updated), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className={cn(
                        "flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                        isBusy && "opacity-100"
                      )}
                    >
                      {existingTask ? (
                        <Button
                          variant="link"
                          size="sm"
                          asChild
                          className="h-auto p-0 text-xs"
                        >
                          <Link href={`/task/${existingTask.id}`}>
                            View Task
                          </Link>
                        </Button>
                      ) : (
                        <>
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => quickCreateTask(issue)}
                                  disabled={isBusy}
                                >
                                  {isQuickCreating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Inbox className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Quick Import</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {isUnread && (
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      markIssueAsRead({
                                        issueKey: issue.key,
                                        updated: issue.updated,
                                      })
                                    }
                                    disabled={isBusy}
                                  >
                                    {isMarkingRead ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Mark as read</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => ignoreIssue(issue.key)}
                                  disabled={isBusy}
                                >
                                  {isIgnoring ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Archive className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Archive</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
