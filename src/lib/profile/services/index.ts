'use server'

import { getUserStrict } from "@/lib/auth/actions";
import { ProfileDto } from "../schemas";
import { getCachedProfile } from "./cached";

export const getProfile = async (): Promise<ProfileDto | null> => {
	const { id: userId } = await getUserStrict()
	return getCachedProfile(userId)
}
