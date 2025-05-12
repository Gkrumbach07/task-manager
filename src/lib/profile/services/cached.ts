"use cache"

import { getRawProfile } from "./queries";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";


export async function getCachedProfile(userId: string) {
    const profile = await getRawProfile(userId)
    if (profile) {
        cacheTag("profile", userId)
    }
    return profile
}
