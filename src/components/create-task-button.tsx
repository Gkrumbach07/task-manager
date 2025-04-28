"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskModal } from "@/components/task-modal";
import { Plus } from "lucide-react";

// This component encapsulates the button and modal logic,
// allowing the main page to remain a server component.
export function CreateTaskButton() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // This handler is called when the TaskModal successfully creates a task.
  // We likely just need to close the modal, as path revalidation
  // triggered by the server action inside TaskModal should refresh the list.
  const handleTaskCreated = () => {
    // Optional: Add any client-side feedback if needed (e.g., toast)
    // console.log('Task created:'); // Example usage
    setIsCreateModalOpen(false); // Close modal
  };

  return (
    <>
      <Button onClick={() => setIsCreateModalOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Task
      </Button>
      {isCreateModalOpen && <TaskModal onSubmit={handleTaskCreated} />}
    </>
  );
}
