
// src/lib/tasks/mappers.ts
import type { Prisma, hidden_jira_issues as PrismaHiddenJiraIssue } from "@prisma/client";
import {
  type CreateHiddenJiraIssueDto,
  type HiddenJiraIssueDto,
} from "./schemas";


export function toPrismaCreateInput(dto: CreateHiddenJiraIssueDto, userId: string): Prisma.hidden_jira_issuesCreateInput {
  return {
    issue_key: dto.issueKey,
    user_id: userId,
  };
}

export function fromPrisma(row: PrismaHiddenJiraIssue): HiddenJiraIssueDto {
	return {
        issueKey: row.issue_key,
    };
}