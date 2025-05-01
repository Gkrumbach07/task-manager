"use server"

import { getUserStrict } from "@/lib/auth/actions";
import { fromPrisma, fromPrismaGithubApiToken, fromPrismaJiraConfig } from "../mappers";
import type { GithubApiTokenDto, JiraConfigDto, ProfileDto } from "../schemas";
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

export const getGithubApiToken = async (): Promise<GithubApiTokenDto | null> => {
    const user = await getUserStrict()
    const row = await prisma.profiles.findUnique({ where: { user_id: user.id } })
  
    return row ? fromPrismaGithubApiToken(row) : null
};