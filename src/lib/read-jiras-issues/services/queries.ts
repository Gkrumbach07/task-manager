"use server"

import { getUserStrict } from "@/lib/auth/actions";
import { fromPrisma } from "../mappers";
import type { ReadJiraIssueDto } from "../schemas";
import { prisma } from "@/lib/prisma/server";


export async function getReadJiraIssues(): Promise<ReadJiraIssueDto[] | null> {
	const user = await getUserStrict()
    const rows = await prisma.read_jira_issues.findMany({ where: { user_id: user.id } })
  
    return rows ? rows.map(fromPrisma) : null
}
