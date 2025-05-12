import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { ClipboardList } from "lucide-react";
import { createSupabaseClient } from "@/lib/prisma/server";
import { HeaderProfileDropdown } from "./header-profile-dropdown";

export default async function Header() {
  const supabase = await createSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 inline-flex justify-center">
      <div className="container flex h-14 items-center justify-between">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <ClipboardList className="h-6 w-6" />
            <span className="font-bold">TaskFlow</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <ModeToggle />
          <HeaderProfileDropdown
            userEmail={user?.email}
            userInitials={getUserInitials()}
          />
        </div>
      </div>
    </header>
  );
}
