"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createJqlQuery,
  updateJqlQuery,
} from "@/lib/jira-jql-queries/services/mutations";
import type {
  JiraJqlQueryDto,
  CreateJiraJqlQueryDto,
  UpdateJiraJqlQueryDto,
} from "@/lib/jira-jql-queries/schemas";
import { ColorPicker } from "@/components/ui/color-picker";
import { useQueryClient } from "@tanstack/react-query";

// Define the schema for the JQL query form input
const jqlQueryFormSchema = z.object({
  label: z.string(),
  jql: z.string().min(1, "JQL query cannot be empty"),
  enabled: z.boolean().optional(),
  labelColor: z.string().optional(),
});

// Define the type for the form input
type JqlQueryFormInput = z.infer<typeof jqlQueryFormSchema>;

export function JiraJqlQueriesModal({
  onOpenChange,
  onSuccess,
  initialData,
}: {
  onOpenChange: (open: boolean) => void;
  onSuccess?: (values: JiraJqlQueryDto) => void;
  initialData?: JiraJqlQueryDto | null;
}) {
  const { toast } = useToast();
  const jc = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<JqlQueryFormInput>({
    resolver: zodResolver(jqlQueryFormSchema),
    defaultValues: {
      label: initialData?.label ?? "",
      jql: initialData?.jql ?? "",
      enabled: initialData?.enabled ?? true,
      labelColor: initialData?.labelColor ?? "",
    },
  });

  const handleSubmit = async (values: JqlQueryFormInput) => {
    setIsLoading(true);
    try {
      let result: JiraJqlQueryDto | null = null;
      const submissionData = jqlQueryFormSchema.parse(values);

      if (!initialData) {
        result = await createJqlQuery(submissionData as CreateJiraJqlQueryDto);
      } else {
        result = await updateJqlQuery({
          ...submissionData,
          id: initialData.id,
        } as UpdateJiraJqlQueryDto);
      }

      if (result) {
        jc.invalidateQueries({ queryKey: ["jqlQueryDefs"] });
        toast({
          title: "Success",
          description: `JQL query ${
            !initialData ? "saved" : "updated"
          } successfully.`,
        });
        onSuccess?.(result);
        onOpenChange(false);
      } else {
        throw new Error(
          `Failed to ${
            !initialData ? "save" : "update"
          } JQL query. API returned null.`
        );
      }
    } catch (error) {
      console.error(
        `Error ${!initialData ? "saving" : "updating"} JQL query:`,
        error
      );
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isEditing = initialData !== null;

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} JQL Query</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this saved JQL query."
              : "Save a new JQL query for later use."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., My Team's Bugs"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jql"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>JQL Query</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='project = "MyProject" AND status = "In Progress" ORDER BY created DESC'
                      className="min-h-[100px]"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="labelColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label Color (Optional)</FormLabel>
                  <FormControl>
                    <ColorPicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Saving..."
                  : isEditing
                  ? "Update Query"
                  : "Save Query"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
