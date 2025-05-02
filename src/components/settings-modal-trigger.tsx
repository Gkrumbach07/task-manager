"use client";

import { useState } from "react";
import { SettingsModal } from "./settings-modal";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/lib/profile/services";

export function SettingsModalTrigger() {
  const [open, setOpen] = useState(false);

  const { data: profile = null } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: open,
  });

  return (
    <>
      <DropdownMenuItem
        onClick={() => setOpen(true)}
        onSelect={(e) => e.preventDefault()}
        className="cursor-pointer"
      >
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>

      {open && <SettingsModal onOpenChange={setOpen} initialData={profile} />}
    </>
  );
}
