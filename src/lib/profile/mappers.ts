
// src/lib/tasks/mappers.ts
import type { Prisma, profiles as PrismaProfile } from "@prisma/client";
import {
  type CreateProfileDto,
  type UpdateProfileDto,
  type ProfileDto,
  JiraConfigDto,
} from "./schemas";
import { calculateCurrentSprint, calculateCurrentQuarter, calculateCurrentSprintStartDate } from "./utils";
import { decrypt, encrypt } from "../auth/crypto";


export function toPrismaCreateInput(dto: CreateProfileDto, userId: string): Prisma.profilesCreateInput {
  return {
    fiscal_year_start_date: dto.fiscalYearStartDate,
    first_sprint_start_date: dto.firstSprintStartDate,
    sprint_length_days: dto.sprintLengthDays,
    user_id: userId,
	jira_base_url: dto.jiraConfig?.baseUrl,
	jira_user_email: dto.jiraConfig?.userEmail,
	jira_api_token: dto.jiraConfig?.apiToken ? encrypt(dto.jiraConfig.apiToken) : null,
  };
}

export function toPrismaUpdateInput(dto: UpdateProfileDto): Prisma.profilesUpdateInput {
  const data: Prisma.profilesUpdateInput = {
	id: dto.id,
  };

  if (dto.fiscalYearStartDate !== undefined) data.fiscal_year_start_date = dto.fiscalYearStartDate;
  if (dto.firstSprintStartDate !== undefined) data.first_sprint_start_date = dto.firstSprintStartDate;
  if (dto.sprintLengthDays !== undefined) data.sprint_length_days = dto.sprintLengthDays;
  if (dto.jiraConfig?.baseUrl !== undefined) data.jira_base_url = dto.jiraConfig.baseUrl;
  if (dto.jiraConfig?.userEmail !== undefined) data.jira_user_email = dto.jiraConfig.userEmail;
  if (dto.jiraConfig?.apiToken !== undefined) data.jira_api_token = dto.jiraConfig.apiToken ? encrypt(dto.jiraConfig.apiToken) : null

  return data;
}

export function fromPrisma(row: PrismaProfile): ProfileDto {
	const { fiscal_year_start_date, first_sprint_start_date, sprint_length_days } = row;
	const currentSprint = (!first_sprint_start_date || !sprint_length_days) ? 1 : calculateCurrentSprint(first_sprint_start_date, sprint_length_days);
	const currentSprintStartDate = (!first_sprint_start_date || !sprint_length_days) ? null : calculateCurrentSprintStartDate(first_sprint_start_date, sprint_length_days);
	const currentQuarter = (!fiscal_year_start_date) ? 1 : calculateCurrentQuarter(fiscal_year_start_date);

    return {
        id: row.id,
        timeConfig: {
            fiscalYearStartDate: fiscal_year_start_date?.toISOString() ?? null,
            firstSprintStartDate: first_sprint_start_date?.toISOString() ?? null,
            sprintLengthDays: sprint_length_days,
            currentSprint: currentSprint,
            currentQuarter: currentQuarter,
            currentSprintStartDate: currentSprintStartDate?.toISOString() ?? null,
        },
        updatedAt: row.updated_at,
		jiraConfig: {
			baseUrl: row.jira_base_url,
			userEmail: row.jira_user_email,
			apiTokenConfigured: row.jira_api_token !== null,
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