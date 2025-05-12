"use client";

import { useEffect, useState } from "react";
import { SettingsModal } from "./settings-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, Loader2 } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { getProfile } from "@/lib/profile/services";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function HeaderProfileDropdown({
  userEmail,
  userInitials,
}: {
  userEmail?: string;
  userInitials: string;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const {
    data: initialData = null,
    isLoading: isInitialDataLoading,
    error: initialDataError,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  useEffect(() => {
    if (initialDataError) {
      toast({
        title: "Error loading profile",
        description: initialDataError.message,
      });
    }
  }, [initialDataError, toast]);

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          {userEmail && (
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Account</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
          )}
          <DropdownMenuItem
            disabled={isInitialDataLoading}
            onSelect={() => {
              setOpen(true);
              setDropdownOpen(false);
            }}
          >
            {isInitialDataLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={signOutAction}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsModal
        onOpenChange={setOpen}
        open={open}
        initialData={initialData ?? undefined}
      />
    </>
  );
}
