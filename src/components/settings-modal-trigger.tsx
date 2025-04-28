"use client";

import { useState } from "react";
import { SettingsModal } from "./settings-modal";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import { ProfileDto } from "@/lib/profile/schemas";
type SettingsModalTriggerProps = {
  userProfile: ProfileDto | null;
};

export function SettingsModalTrigger({
  userProfile,
}: SettingsModalTriggerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
        }}
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer"
      >
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>

      {isModalOpen && (
        <SettingsModal
          onOpenChange={setIsModalOpen}
          initialData={userProfile}
        />
      )}
    </>
  );
}
