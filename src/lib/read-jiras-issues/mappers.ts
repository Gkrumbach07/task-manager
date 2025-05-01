
// src/lib/tasks/mappers.ts
import type { Prisma, read_jira_issues as PrismaReadJiraIssue } from "@prisma/client";
import {
  type CreateReadJiraIssueDto,
  type ReadJiraIssueDto,
} from "./schemas";


export function toPrismaCreateInput(dto: CreateReadJiraIssueDto, userId: string): Prisma.read_jira_issuesCreateInput {
  return {
    issue_key: dto.issueKey,
    user_id: userId,
    last_read_uuid: dto.lastReadUuid,
  };
}


export function fromPrisma(row: PrismaReadJiraIssue): ReadJiraIssueDto {
	return {
        issueKey: row.issue_key,
        lastReadUuid: row.last_read_uuid,
    };
}