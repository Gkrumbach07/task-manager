import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Define public paths that don't require authentication
const publicPaths = ["/login", "/signup", "/auth/callback"];
// Define paths that logged-in users should be redirected away from
const authRoutes = ["/login", "/signup"];

export const updateSession = async (request: NextRequest) => {
	let response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	try {
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() {
						return request.cookies.getAll();
					},
					setAll(cookiesToSet) {
						cookiesToSet.forEach(({ name, value }) =>
							request.cookies.set(name, value),
						);
						response = NextResponse.next({
							request,
						});
						cookiesToSet.forEach(({ name, value, options }) =>
							response.cookies.set(name, value, options),
						);
					},
				},
			},
		);

		// Refresh session if expired - important to do before checking auth.
		const { data: { user } } = await supabase.auth.getUser();

		const { pathname } = request.nextUrl;

		// Check if the current path is public
		const isPublicPath = publicPaths.some((path) => pathname.startsWith(path)) || pathname === '/';

		// Check if the current path is an auth route like /login or /signup
		const isAuthRoute = authRoutes.some((path) => pathname.startsWith(path));

		// Redirect logged-in users away from auth routes
		if (isAuthRoute && user) {
			// Redirect to a default protected page, e.g., '/active'
			return NextResponse.redirect(new URL('/active', request.url));
		}

		// Redirect logged-out users trying to access protected routes
		if (!isPublicPath && !user) {
			return NextResponse.redirect(new URL('/login', request.url));
		}

		// Allow the request to proceed if none of the above conditions met
		return response;

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (e) {
		// Fallback response in case of errors (e.g., Supabase client issues)
		return NextResponse.next({
			request: {
				headers: request.headers,
			},
		});
	}
};