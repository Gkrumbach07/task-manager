
// src/lib/tasks/mappers.ts
import type { Prisma, profiles as PrismaProfile } from "@prisma/client";
import {
  type CreateProfileDto,
  type UpdateProfileDto,
  type ProfileDto,
  JiraConfigDto,
  GithubApiTokenDto,
  NotionConfigDto,
} from "./schemas";
import { decrypt, encrypt } from "../auth/crypto";


export function toPrismaCreateInput(dto: CreateProfileDto, userId: string): Prisma.profilesCreateInput {
  return {
    user_id: userId,
    jira_base_url: dto.jiraConfig?.baseUrl,
    jira_user_email: dto.jiraConfig?.userEmail,
    jira_api_token: dto.jiraConfig?.apiToken ? encrypt(dto.jiraConfig.apiToken) : null,
    github_api_token: dto.githubApiToken ? encrypt(dto.githubApiToken) : null,
    notion_api_token: dto.notionConfig?.apiToken ? encrypt(dto.notionConfig.apiToken) : null,
    notion_database_id: dto.notionConfig?.databaseId,
  };
}

export function toPrismaUpdateInput(dto: UpdateProfileDto): Prisma.profilesUpdateInput {
  const data: Prisma.profilesUpdateInput = {
	id: dto.id,
  };

  if (dto.jiraConfig?.baseUrl !== undefined) data.jira_base_url = dto.jiraConfig.baseUrl;
  if (dto.jiraConfig?.userEmail !== undefined) data.jira_user_email = dto.jiraConfig.userEmail;
  if (dto.jiraConfig?.apiToken !== undefined) data.jira_api_token = dto.jiraConfig.apiToken ? encrypt(dto.jiraConfig.apiToken) : null;
  if (dto.githubApiToken !== undefined) data.github_api_token = dto.githubApiToken ? encrypt(dto.githubApiToken) : null;
  if (dto.notionConfig?.apiToken !== undefined) data.notion_api_token = dto.notionConfig.apiToken ? encrypt(dto.notionConfig.apiToken) : null;
  if (dto.notionConfig?.databaseId !== undefined) data.notion_database_id = dto.notionConfig.databaseId;

  return data;
}

export function fromPrisma(row: PrismaProfile): ProfileDto {

    return {
      id: row.id,
      updatedAt: row.updated_at,
      jiraConfig: {
        baseUrl: row.jira_base_url,
        userEmail: row.jira_user_email,
        apiTokenConfigured: row.jira_api_token !== null,
      },
      githubApiToken: row.github_api_token ? decrypt(row.github_api_token) : undefined,
      notionConfig: {
        databaseId: row.notion_database_id,
        apiTokenConfigured: row.notion_api_token !== null,
      },
    };
}

export function fromPrismaJiraConfig(row: PrismaProfile): JiraConfigDto {
	return {
		baseUrl: row.jira_base_url,
		userEmail: row.jira_user_email,
		apiToken: row.jira_api_token ? decrypt(row.jira_api_token) : null,
	};
}

export function fromPrismaGithubApiToken(row: PrismaProfile): GithubApiTokenDto {
	return {
		token: row.github_api_token ? decrypt(row.github_api_token) : null,
	};
}

export function fromPrismaNotionConfig(row: PrismaProfile): NotionConfigDto {
	return {
		token: row.notion_api_token ? decrypt(row.notion_api_token) : null,
		databaseId: row.notion_database_id,
	};
}