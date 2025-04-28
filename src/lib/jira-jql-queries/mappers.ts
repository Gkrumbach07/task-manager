import type { Prisma, jira_jql_queries as PrismaJiraJqlQuery } from "@prisma/client";
import {
    type CreateJiraJqlQueryDto,
    type UpdateJiraJqlQueryDto,
    type JiraJqlQueryDto,
} from "./schemas";

export function toPrismaCreateInput(dto: CreateJiraJqlQueryDto, userId: string): Prisma.jira_jql_queriesCreateInput {
  return {
    label: dto.label,
    label_color: dto.labelColor,
    jql: dto.jql,
    enabled: dto.enabled,
    user_id: userId,
  };
}

export function toPrismaUpdateInput(dto: UpdateJiraJqlQueryDto): Prisma.jira_jql_queriesUpdateInput {
  const data: Prisma.jira_jql_queriesUpdateInput = {
    id: dto.id,
  };

  if (dto.label !== undefined) data.label = dto.label;
  if (dto.jql !== undefined) data.jql = dto.jql;
  if (dto.enabled !== undefined) data.enabled = dto.enabled;
  if (dto.labelColor !== undefined) data.label_color = dto.labelColor;
  
  return data;
}

export function fromPrisma(row: PrismaJiraJqlQuery): JiraJqlQueryDto {
    return {
        id: row.id,
        label: row.label,
        labelColor: row.label_color,
        jql: row.jql,
        enabled: row.enabled,
        updatedAt: row.updated_at,
        createdAt: row.created_at,
    };
} 