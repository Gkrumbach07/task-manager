"use client";

import { useState, useEffect } from "react"; // Corrected import
import { format, addDays, subDays } from "date-fns";
import { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"; // Assuming shadcn/ui Calendar
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Assuming shadcn/ui Popover
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TiptapEditor } from "@/components/TiptapEditor";
import { searchTasks } from "@/lib/tasks/services";

// Mock data/functions for now - adjusted for JSON
const fetchPlan = async (date: Date): Promise<JSONContent | string> => {
  console.log(`Fetching plan for ${format(date, "yyyy-MM-dd")}`);
  // Return Tiptap JSON structure or string for initial/error states
  const fakePlans: Record<string, JSONContent> = {
    [format(new Date(), "yyyy-MM-dd")]: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [
            {
              type: "text",
              text: `Today's Plan (${format(new Date(), "PPP")})`,
            },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 1" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "Item 2 " },
                    {
                      type: "mention", // Tiptap mention node
                      attrs: { id: "task-123", label: "Sample Task" },
                    },
                    { type: "text", text: " " }, // Space after mention
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    [format(subDays(new Date(), 1), "yyyy-MM-dd")]: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [
            {
              type: "text",
              text: `Yesterday's Plan (${format(
                subDays(new Date(), 1),
                "PPP"
              )})`,
            },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Review yesterday's tasks" }],
        },
      ],
    },
  };
  await new Promise((resolve) => setTimeout(resolve, 300));
  return (
    fakePlans[format(date, "yyyy-MM-dd")] || {
      // Default content as a simple Tiptap JSON doc
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `Plan for ${format(date, "PPP")}. Start planning! `,
            },
          ],
        },
      ],
    }
  );
};

// Save plan now expects JSONContent
const savePlan = async (date: Date, content: JSONContent): Promise<void> => {
  console.log(
    `Saving plan (JSON) for ${format(date, "yyyy-MM-dd")}:`,
    JSON.stringify(content)
  ); // Log stringified JSON
  // Replace with actual saving logic (store JSON directly)
  await new Promise((resolve) => setTimeout(resolve, 500));
};

export default function PlannerPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  // Update state type to handle JSONContent or initial string/null
  const [planContent, setPlanContent] = useState<JSONContent | string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  const searchTasksForMention = async (query: string) => {
    const tasks = await searchTasks(query, 5);
    return tasks.map((task) => ({
      id: task.id,
      label: task.title,
    }));
  };

  // Fetch plan when date changes
  useEffect(() => {
    const loadPlan = async () => {
      setIsLoading(true);
      try {
        const content = await fetchPlan(currentDate);
        setPlanContent(content);
      } catch (error) {
        console.error("Failed to load plan:", error);
        // Use simple JSON for error message
        setPlanContent({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `Error loading plan for ${format(currentDate, "PPP")}`,
                },
              ],
            },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    };
    void loadPlan();
  }, [currentDate]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      setIsCalendarOpen(false); // Close popover on date selection
    }
  };

  const handlePreviousDay = () => {
    setCurrentDate((prevDate) => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setCurrentDate((prevDate) => addDays(prevDate, 1));
  };

  // Update handleSave to expect JSONContent
  const handleSave = async (newContent: JSONContent) => {
    try {
      await savePlan(currentDate, newContent);
      // setPlanContent(newContent); // Setting state might still cause issues with editor state sync
      console.log("Plan saved successfully (via Tiptap debounce - JSON)");
    } catch (error) {
      console.error("Failed to save plan:", error);
    }
  };

  // --- Task Linking Logic is now handled by TiptapEditor ---

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Planner</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousDay}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[200px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(currentDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading || planContent === null ? ( // Show loader if loading or content is null
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-4/6"></div>
        </div>
      ) : (
        <TiptapEditor
          // Pass JSON content (or initial empty string if needed, though fetchPlan should handle defaults)
          content={planContent || ""}
          onSave={handleSave}
          onSearchTasks={async (query) => {
            const tasks = await searchTasksForMention(query);
            return tasks;
          }}
        />
      )}
    </div>
  );
}
