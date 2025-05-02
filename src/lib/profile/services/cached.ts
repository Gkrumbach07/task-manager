"use cache"

import { getUserStrict } from "@/lib/auth/actions";
import { fromPrismaGithubApiToken, fromPrismaJiraConfig } from "../mappers";
import type { GithubApiTokenDto, JiraConfigDto } from "../schemas";
import { prisma } from "@/lib/prisma/server";
import { getRawProfile } from "./queries";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";


export async function getCachedProfile(userId: string) {
    const profile = await getRawProfile(userId)
    if (profile) {
        cacheTag("profile", userId)
    }
    return profile
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