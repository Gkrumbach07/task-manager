"use server";

import { createSupabaseClient } from "@/lib/prisma/server";
import { encodedRedirect } from "@/lib/auth/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
	const email = formData.get("email")?.toString();
	const password = formData.get("password")?.toString();
	const supabase = await createSupabaseClient();
	const origin = process.env.NEXT_PUBLIC_APP_URL


	if (!email || !password) {
		return encodedRedirect(
			"error",
			"/signup",
			"Email and password are required",
		);
	}

	const { error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: `${origin}/auth/callback`,
		},
	});

	if (error) {
		console.error(error.code + " " + error.message);
		return encodedRedirect("error", "/signup", error.message);
	} else {
		return encodedRedirect(
			"success",
			"/signup",
			"Thanks for signing up! Please check your email for a verification link.",
		);
	}
};

export const signInAction = async (formData: FormData) => {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const supabase = await createSupabaseClient();

	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		return encodedRedirect("error", "/login", error.message);
	}

	return redirect("/");
};

export const forgotPasswordAction = async (formData: FormData) => {
	const email = formData.get("email")?.toString();
	const supabase = await createSupabaseClient();
	const origin = (await headers()).get("origin");
	const callbackUrl = formData.get("callbackUrl")?.toString();

	if (!email) {
		return encodedRedirect("error", "/forgot-password", "Email is required");
	}

	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${origin}/auth/callback?redirect_to=/reset-password`,
	});

	if (error) {
		console.error(error.message);
		return encodedRedirect(
			"error",
			"/forgot-password",
			"Could not reset password",
		);
	}

	if (callbackUrl) {
		return redirect(callbackUrl);
	}

	return encodedRedirect(
		"success",
		"/forgot-password",
		"Check your email for a link to reset your password.",
	);
};

export const resetPasswordAction = async (formData: FormData) => {
	const supabase = await createSupabaseClient();

	const password = formData.get("password") as string;
	const confirmPassword = formData.get("confirmPassword") as string;

	if (!password || !confirmPassword) {
		encodedRedirect(
			"error",
			"/reset-password",
			"Password and confirm password are required",
		);
	}

	if (password !== confirmPassword) {
		encodedRedirect(
			"error",
			"/reset-password",
			"Passwords do not match",
		);
	}

	const { error } = await supabase.auth.updateUser({
		password: password,
	});

	if (error) {
		encodedRedirect(
			"error",
			"/reset-password",
			"Password update failed",
		);
	}

	encodedRedirect("success", "/reset-password", "Password updated");
};

export const signOutAction = async () => {
	const supabase = await createSupabaseClient();
	await supabase.auth.signOut();
	return redirect("/login");
};

export const getUser = async () => {
	const supabase = await createSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();

	return user;
};

export const getUserStrict = async () => {
	const user = await getUser();
	if (!user) {
		throw new Error("Forbidden: User not authenticated (403)");
	}
	return user;
};
