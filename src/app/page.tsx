import { createSupabaseClient } from "@/lib/prisma/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!!user) {
    return redirect("/active");
  }
  // Show loading state while checking auth
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
