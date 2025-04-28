"use server"

import { getUserStrict } from "@/lib/auth/actions";
import { fromPrisma } from "../mappers";
import type { HiddenJiraIssueDto } from "../schemas";
import { prisma } from "@/lib/prisma/server";


export async function getHiddenJiraIssues(): Promise<HiddenJiraIssueDto[] | null> {
	const user = await getUserStrict()
    const rows = await prisma.hidden_jira_issues.findMany({ where: { user_id: user.id } })
  
    return rows ? rows.map(fromPrisma) : null
}
