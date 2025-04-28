"use server"

import { getUserStrict } from "@/lib/auth/actions";
import { fromPrisma, fromPrismaJiraConfig } from "../mappers";
import type { JiraConfigDto, ProfileDto } from "../schemas";
import { prisma } from "@/lib/prisma/server";


export async function getProfile(): Promise<ProfileDto | null> {
	const user = await getUserStrict()
    const row = await prisma.profiles.findUnique({ where: { user_id: user.id } })
  
    return row ? fromPrisma(row) : null
}

export const getJiraConfig = async (): Promise<JiraConfigDto | null> => {
    const user = await getUserStrict()
    const row = await prisma.profiles.findUnique({ where: { user_id: user.id } })
  
    return row ? fromPrismaJiraConfig(row) : null
};
