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
import {
  ExternalLink,
  Loader2,
  Archive,
  LinkIcon,
  MailOpen,
  Mail,
  Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import type { JiraDto } from "@/lib/jira/schemas";
import type { ReadJiraIssueDto } from "@/lib/read-jiras-issues/schemas";
import { CreateNotionPageDto, NotionCustomEmoji } from "@/lib/notion/schemas";
import { createNotionPage } from "@/lib/notion/services";
import { JiraIssueWithQuery } from "./types";
import { JiraType } from "@/lib/jira/enums";

const mapJiraIssueTypeToNotionCustomEmoji = (
  issueType: JiraType
): NotionCustomEmoji => {
  switch (issueType) {
    case JiraType.TASK:
      return NotionCustomEmoji.JiraTask;
    case JiraType.SUB_TASK:
      return NotionCustomEmoji.JiraSubtask;
    case JiraType.BUG:
      return NotionCustomEmoji.JiraBug;
    case JiraType.STORY:
      return NotionCustomEmoji.JiraStory;
    case JiraType.EPIC:
      return NotionCustomEmoji.JiraEpic;
  }
};

// Helper function to map Jira issue to CreateNotionPageDto
const jiraToCreateNotionPageDto = (issue: JiraDto): CreateNotionPageDto => ({
  title: issue.title,
  sourceJiraKey: issue.key,
  type: mapJiraIssueTypeToNotionCustomEmoji(issue.type),
});

type DueDateStatus = {
  text: string;
  className: string;
};

const getDueDateStatus = (
  dueDate: string | null | undefined
): DueDateStatus => {
  if (!dueDate) {
    return {
      text: "No due date",
      className: "text-muted-foreground",
    };
  }

  const date = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date < today) {
    const daysOverdue = Math.floor(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      text: `Past due ${daysOverdue} ${daysOverdue === 1 ? "day" : "days"}`,
      className: "text-destructive",
    };
  }

  if (date.toDateString() === today.toDateString()) {
    return {
      text: "Due today",
      className: "text-yellow-500",
    };
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return {
      text: "Due tomorrow",
      className: "text-yellow-500",
    };
  }

  const daysRemaining = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return {
    text: `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} remaining`,
    className: "",
  };
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Done":
      return "outline";
    case "In Progress":
      return "default";
    default:
      return "secondary";
  }
};

type JiraIssueTableProps = {
  issues: JiraIssueWithQuery[];
  readIssues: ReadJiraIssueDto[] | undefined;
  onIssueIgnored: (issueKey: string) => Promise<void>;
  onIssueRead: (issueKey: string, lastReadUuid: string) => Promise<void>;
  onIssueUnread: (issueKey: string) => Promise<void>;
  onNotionPageCreated: () => void;
};

export function JiraIssueTable({
  issues,
  readIssues,
  onIssueIgnored,
  onIssueRead,
  onIssueUnread,
  onNotionPageCreated,
}: JiraIssueTableProps) {
  const { toast } = useToast();

  // --- Mutation Hooks ---
  const {
    mutate: markIssueAsRead,
    variables: markingAsReadVars,
    isPending: isMarkingRead,
  } = useMutation({
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
  });

  const {
    mutate: markIssueAsUnread,
    variables: markingAsUnreadVars,
    isPending: isMarkingUnread,
  } = useMutation({
    mutationFn: ({ issueKey }: { issueKey: string }) => onIssueUnread(issueKey),
    onSuccess: (_, vars) => {
      toast({ title: `Marked ${vars.issueKey} as unread.` });
    },
    onError: (error, vars) => {
      toast({
        title: `Error marking ${vars.issueKey} as unread`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const {
    mutate: ignoreIssue,
    variables: ignoringIssueVars,
    isPending: isIgnoring,
  } = useMutation({
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

  const {
    mutate: quickCreateNotionPage,
    variables: quickCreatingNotionVars,
    isPending: isQuickCreatingNotion,
  } = useMutation({
    mutationFn: (issue: JiraDto) =>
      createNotionPage(jiraToCreateNotionPageDto(issue)),
    onSuccess: () => {
      toast({
        title: "Notion Page Created",
      });
      onNotionPageCreated();
    },
    onError: (error, issue) => {
      console.error("Error during Notion page quick create:", error);
      toast({
        title: "Error Creating Notion Page",
        description: `For Jira issue ${issue.key}: ${
          error instanceof Error ? error.message : "An unknown error occurred."
        }`,
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-3">Notion</TableHead>
              <TableHead className="w-[100px]">Key</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[120px]">Updated</TableHead>
              <TableHead className="text-right w-[150px]" />
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
              const existingNotionPage = issue.notionPage;
              const isRead = readIssues?.some(
                (ri) => ri.issueKey === issue.key
              );
              const isUnread = !isRead;
              const isIgnoringIssue =
                ignoringIssueVars === issue.key && isIgnoring;
              const isMarkingReadIssue =
                markingAsReadVars?.issueKey === issue.key && isMarkingRead;
              const isMarkingUnreadIssue =
                markingAsUnreadVars?.issueKey === issue.key && isMarkingUnread;
              const isQuickCreatingIssue =
                quickCreatingNotionVars?.key === issue.key &&
                isQuickCreatingNotion;
              const isBusy =
                isIgnoringIssue ||
                isMarkingReadIssue ||
                isMarkingUnreadIssue ||
                isQuickCreatingIssue;

              return (
                <TableRow
                  key={issue.key}
                  className={cn(
                    "group",
                    // isUnread && "bg-primary/5 hover:bg-primary/10",
                    isRead && "opacity-60"
                  )}
                >
                  <TableCell className="flex items-center justify-center">
                    {existingNotionPage && (
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="link"
                              size="icon"
                              onClick={() =>
                                window.open(existingNotionPage.url, "_blank")
                              }
                            >
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex items-center gap-3">
                              {existingNotionPage.status && (
                                <Badge
                                  variant={getStatusBadgeVariant(
                                    existingNotionPage.status
                                  )}
                                  className="px-2 py-0.5"
                                >
                                  {existingNotionPage.status}
                                </Badge>
                              )}
                              <span className="text-muted-foreground text-xs">
                                {existingNotionPage.title.slice(0, 50)}...
                              </span>
                              {existingNotionPage.dueDate && (
                                <span
                                  className={cn(
                                    "text-xs ml-auto",
                                    getDueDateStatus(existingNotionPage.dueDate)
                                      .className
                                  )}
                                >
                                  {
                                    getDueDateStatus(existingNotionPage.dueDate)
                                      .text
                                  }
                                </span>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
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
                    {issue.fromJqlQuery && issue.fromJqlQuery.length > 0 && (
                      <span className="ml-2 space-x-1">
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
                                  {issue.fromJqlQuery.length} queries
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
                        <span className={cn(isUnread && "font-semibold")}>
                          {issue.title}
                        </span>
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
                      {!existingNotionPage && (
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => quickCreateNotionPage(issue)}
                                disabled={isBusy}
                              >
                                {isQuickCreatingIssue ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Create Notion Page</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {isUnread ? (
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
                                  <MailOpen className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Mark as read</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() =>
                                  markIssueAsUnread({
                                    issueKey: issue.key,
                                  })
                                }
                                disabled={isBusy}
                              >
                                {isMarkingUnread ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Mark as unread</TooltipContent>
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
