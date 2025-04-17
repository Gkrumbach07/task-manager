"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, ClipboardList, Settings, User, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth/auth-context"

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut, isLoading } = useAuth()

  const isActive = (path: string) => {
    return pathname === path
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U"
    return user.email.charAt(0).toUpperCase()
  }

  // If auth is still loading or on auth pages, don't show the header
  if (isLoading || pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password") {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <ClipboardList className="h-6 w-6" />
            <span className="font-bold">TaskFlow</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center space-x-2">
          <nav className="flex items-center space-x-4 lg:space-x-6">
            <Link
              href="/backlog"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/backlog") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Backlog
            </Link>
            <Link
              href="/active"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/active") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Active
            </Link>
            <Link
              href="/archive"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/archive") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Archive
            </Link>
            <Link
              href="/explore"
              className={`text-sm font-medium transition-colors hover:text-primary relative ${
                isActive("/explore") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Explore
              <Badge className="absolute -top-2 -right-4 h-5 w-5 flex items-center justify-center p-0 text-xs">3</Badge>
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">2</Badge>
          </Button>
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Account</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
