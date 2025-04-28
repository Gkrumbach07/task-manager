'use server'

import { prisma } from "@/lib/prisma/server";
import { CreateProfileDto, ProfileDto, UpdateProfileDto } from "../schemas";
import { fromPrisma, toPrismaCreateInput, toPrismaUpdateInput } from "../mappers";
import { getUserStrict } from "@/lib/auth/actions";

// Update a task
export const updateProfile = async (profile: UpdateProfileDto): Promise<ProfileDto | null> => {
	const user = await getUserStrict()
	try {
	  const data = await prisma.profiles.update({
		  where: { id: profile.id, user_id: user.id },
		  data: toPrismaUpdateInput(profile),
	  });
	  return fromPrisma(data);
	} catch (error) {
	  console.error("Error updating profile:", error);
	  return null;
	}
  };

export const createProfile = async (profile: CreateProfileDto): Promise<ProfileDto | null> => {
	const user = await getUserStrict()
	try {
		const data = await prisma.profiles.create({
			data: toPrismaCreateInput(profile, user.id),
		});
		return fromPrisma(data);
	} catch (error) {
		console.error("Error creating profile:", error);
		return null;
	}
};

export const deleteProfile = async (id: string): Promise<boolean> => {
	const user = await getUserStrict()
	try {
		await prisma.profiles.delete({ where: { id, user_id: user.id } });
		return true;
	} catch (error) {
		console.error("Error deleting profile:", error);
		return false;
	}
};
