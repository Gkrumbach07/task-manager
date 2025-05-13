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
  Calendar,
  Edit2,
} from "lucide-react";
import {
  formatDistanceToNow,
  addDays,
  format,
  getDay,
  isLeapYear,
  startOfToday,
  getYear,
  getMonth,
} from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import type { JiraDto } from "@/lib/jira/schemas";
import type { ReadJiraIssueDto } from "@/lib/read-jiras-issues/schemas";
import { CreateNotionPageDto, NotionCustomEmoji } from "@/lib/notion/schemas";
import { createNotionPage } from "@/lib/notion/services";
import { JiraIssueWithQuery } from "./types";
import { JiraType } from "@/lib/jira/enums";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
    case JiraType.FEATURE:
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

// Format for dates passed to Notion/APIs
const DATE_FORMAT = "yyyy-MM-dd";

// Helper to find the end of the current 3-week sprint
// Based on the current sprint which started April 28, 2025
const calculateEndOfCurrentSprint = (): string => {
  const today = startOfToday();
  const sprintStart = new Date("2025-04-28");

  // Calculate weeks since sprint start
  const weeksSinceStart = Math.floor(
    (today.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );

  // Calculate which week of the current sprint we're in (0-2)
  const currentSprintWeek = weeksSinceStart % 3;

  // Calculate days until next Friday
  const currentDay = getDay(today);
  const daysUntilFriday = (5 - currentDay + 7) % 7;

  // If we're in the last week of the sprint, use this Friday
  // Otherwise, use the Friday after next
  const targetFriday = addDays(
    today,
    currentSprintWeek === 2 ? daysUntilFriday : daysUntilFriday + 7
  );

  return format(targetFriday, DATE_FORMAT);
};

// Helper to find the end of the next 3-week sprint
const calculateEndOfNextSprint = (): string => {
  const endOfCurrent = calculateEndOfCurrentSprint();
  // Parse the date string correctly before adding days
  const endOfCurrentDate = new Date(`${endOfCurrent}T00:00:00`); // Avoid timezone issues
  const nextSprintEnd = addDays(endOfCurrentDate, 21); // Add 21 days (3 weeks) to get the end of next sprint
  return format(nextSprintEnd, DATE_FORMAT);
};

// Helper to find the end date of the next quarter based on Notion logic
const calculateEndOfNextQuarter = (): string => {
  const today = startOfToday();
  const year = getYear(today);
  const month = getMonth(today); // 0-indexed (0 = Jan, 11 = Dec)

  // Fiscal Quarter ends: Feb 28/29 (Q4), May 31 (Q1), Aug 31 (Q2), Nov 30 (Q3)
  if (month <= 1) {
    // Current: Q4 (Jan, Feb) -> Target Q4 End: Feb 28/29
    const febDays = isLeapYear(year) ? 29 : 28;
    return `${year}-02-${febDays}`;
  } else if (month <= 4) {
    // Current: Q1 (Mar, Apr, May) -> Target Q1 End: May 31
    return `${year}-05-31`;
  } else if (month <= 7) {
    // Current: Q2 (Jun, Jul, Aug) -> Target Q2 End: Aug 31
    return `${year}-08-31`;
  } else if (month <= 10) {
    // Current: Q3 (Sep, Oct, Nov) -> Target Q3 End: Nov 30
    return `${year}-11-30`;
  } else {
    // Current: Q4 (Dec) -> Target Q4 End: Feb 28/29 of *next* year
    const nextYear = year + 1;
    const febDays = isLeapYear(nextYear) ? 29 : 28;
    return `${nextYear}-02-${febDays}`;
  }
};

type JiraIssueTableProps = {
  issues: JiraIssueWithQuery[];
  readIssues: ReadJiraIssueDto[] | undefined;
  onIssueIgnored: (issueKey: string) => Promise<void>;
  onIssueRead: (issueKey: string, lastReadUuid: string) => Promise<void>;
  onIssueUnread: (issueKey: string) => Promise<void>;
  onUpdateNotionPageDueDate: (pageId: string, dueDate: string) => Promise<void>;
  onNotionPageCreated: () => void;
};

export function JiraIssueTable({
  issues,
  readIssues,
  onIssueIgnored,
  onIssueRead,
  onIssueUnread,
  onUpdateNotionPageDueDate,
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

  const { mutate: updateDueDate, isPending: isUpdatingDueDate } = useMutation({
    mutationFn: ({ pageId, dueDate }: { pageId: string; dueDate: string }) =>
      onUpdateNotionPageDueDate(pageId, dueDate),
    onSuccess: () => {
      toast({ title: `Due date updated for Notion page.` });
      // Optionally refetch or update local state if needed
    },
    onError: (error, vars) => {
      toast({
        title: `Error updating due date for Notion page ${vars.pageId}`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDueDateChange = (issueKey: string, type: string) => {
    const issue = issues.find((i) => i.key === issueKey);
    if (!issue?.notionPage?.id) {
      toast({
        title: "Cannot update due date",
        description: "No linked Notion page found for this issue.",
        variant: null,
      });
      return;
    }

    let newDueDate: string;
    switch (type) {
      case "this-sprint":
        newDueDate = calculateEndOfCurrentSprint();
        break;
      case "next-sprint":
        newDueDate = calculateEndOfNextSprint();
        break;
      case "next-quarter":
        newDueDate = calculateEndOfNextQuarter();
        break;
      default:
        toast({
          title: "Invalid due date type",
          variant: null,
        });
        return;
    }

    updateDueDate({ pageId: issue.notionPage.id, dueDate: newDueDate });
  };

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
              <TableHead className="w-[120px]">Due date</TableHead>
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
                  <TableCell
                    className={cn(
                      "text-xs inline-flex items-center gap-1",
                      isUnread && "font-semibold",
                      existingNotionPage?.dueDate &&
                        getDueDateStatus(existingNotionPage?.dueDate).className
                    )}
                  >
                    {existingNotionPage && (
                      <>
                        {existingNotionPage?.dueDate &&
                          getDueDateStatus(existingNotionPage?.dueDate).text}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
                              {existingNotionPage?.dueDate ? (
                                <Edit2 className="h-4 w-4" />
                              ) : (
                                <Calendar className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              disabled={
                                !existingNotionPage?.id || isUpdatingDueDate
                              }
                              onSelect={() =>
                                handleDueDateChange(issue.key, "this-sprint")
                              }
                            >
                              Due this sprint
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={
                                !existingNotionPage?.id || isUpdatingDueDate
                              }
                              onSelect={() =>
                                handleDueDateChange(issue.key, "next-sprint")
                              }
                            >
                              Due next sprint
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
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
