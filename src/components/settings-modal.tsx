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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createProfile, updateProfile } from "@/lib/profile/services/mutations";
import type { ProfileDto } from "@/lib/profile/schemas";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { calculateFirstSprintStartDate } from "@/lib/profile/utils";
import { Switch } from "./ui/switch";

// Define the schema for the form input using zod
const formSchema = z
  .object({
    fiscalYearStartMonth: z.number().optional(),
    fiscalYearStartDay: z.number().optional(),
    currentSprintNumber: z.number().optional(),
    currentSprintStartDate: z.string().optional(), // Consider validating date format if needed
    sprintLengthDays: z.coerce
      .number()
      .int("Sprint length must be an integer.")
      .positive("Sprint length must be a positive number.")
      .optional(),
    jiraConnectionEnabled: z.boolean(),
    jiraBaseUrl: z.string().optional(),
    jiraUserEmail: z.string().email("Invalid email address.").optional(),
    jiraApiToken: z.string().optional(),
    jiraApiTokenConfigured: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.jiraConnectionEnabled) {
      // If Jira connection is enabled, baseUrl and userEmail are required.
      if (!data.jiraBaseUrl || data.jiraBaseUrl.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Jira Base URL is required when connection is enabled.",
          path: ["jiraBaseUrl"],
        });
      }
      if (!data.jiraUserEmail || data.jiraUserEmail.trim() === "") {
        // Email format is checked by .email(), this ensures it's present
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Jira User Email is required when connection is enabled.",
          path: ["jiraUserEmail"],
        });
      }

      // If Jira connection is enabled, either a new token must be provided OR one must already be configured.
      const isNewTokenProvided =
        data.jiraApiToken && data.jiraApiToken.trim() !== "";
      const isTokenAlreadyConfigured = data.jiraApiTokenConfigured;

      if (!isNewTokenProvided && !isTokenAlreadyConfigured) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "A new Jira API Token must be provided if the connection is enabled and no token is currently configured.",
          path: ["jiraApiToken"],
        });
      }
    }
  });

const transformFormSchema = formSchema.transform((formData) => {
  let fiscalYearStartDate;
  if (
    formData.fiscalYearStartMonth != null &&
    formData.fiscalYearStartDay != null
  ) {
    fiscalYearStartDate = new Date(
      new Date().getFullYear(),
      formData.fiscalYearStartMonth,
      formData.fiscalYearStartDay
    ).toISOString();
  }
  let firstSprintStartDate;
  if (
    formData.currentSprintStartDate &&
    formData.sprintLengthDays &&
    formData.currentSprintNumber
  ) {
    firstSprintStartDate = calculateFirstSprintStartDate(
      new Date(formData.currentSprintStartDate),
      formData.currentSprintNumber,
      formData.sprintLengthDays
    );
  }

  let jiraConfig;
  if (formData.jiraConnectionEnabled) {
    jiraConfig = {
      baseUrl: formData.jiraBaseUrl,
      userEmail: formData.jiraUserEmail,
      apiToken: !formData.jiraApiTokenConfigured
        ? formData.jiraApiToken
        : undefined,
    };
  } else {
    jiraConfig = {
      baseUrl: null,
      userEmail: null,
      apiToken: null,
    };
  }

  return {
    fiscalYearStartDate: fiscalYearStartDate,
    firstSprintStartDate: firstSprintStartDate,
    sprintLengthDays: formData.sprintLengthDays,
    jiraConfig,
  };
});

const transformFormDataForCreateSchema = transformFormSchema.transform(
  (formData) => {
    // If the Jira connection is enabled, all fields are required.
    let jiraConfig;
    if (
      formData.jiraConfig.apiToken &&
      formData.jiraConfig.baseUrl &&
      formData.jiraConfig.userEmail
    ) {
      jiraConfig = {
        baseUrl: formData.jiraConfig.baseUrl,
        userEmail: formData.jiraConfig.userEmail,
        apiToken: formData.jiraConfig.apiToken,
      };
    }
    return {
      ...formData,
      jiraConfig,
    };
  }
);

// Infer the type from the schema
type SettingsFormInput = z.infer<typeof formSchema>;

// Define props for the modal
type SettingsModalProps = {
  onOpenChange: (open: boolean) => void;
  initialData: ProfileDto | null;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function SettingsModal({
  onOpenChange,
  initialData,
}: SettingsModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const form = useForm<SettingsFormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fiscalYearStartMonth: initialData?.timeConfig?.fiscalYearStartDate
        ? new Date(initialData.timeConfig.fiscalYearStartDate).getUTCMonth()
        : undefined,
      fiscalYearStartDay: initialData?.timeConfig?.fiscalYearStartDate
        ? new Date(initialData.timeConfig.fiscalYearStartDate).getUTCDate()
        : undefined,
      currentSprintNumber: initialData?.timeConfig?.currentSprint || 1,
      currentSprintStartDate: initialData?.timeConfig?.currentSprintStartDate
        ? format(initialData.timeConfig.currentSprintStartDate, "yyyy-MM-dd")
        : undefined,
      sprintLengthDays: initialData?.timeConfig?.sprintLengthDays ?? 14,
      jiraConnectionEnabled:
        initialData?.jiraConfig?.apiTokenConfigured ?? false,
      jiraBaseUrl: initialData?.jiraConfig?.baseUrl ?? "",
      jiraUserEmail: initialData?.jiraConfig?.userEmail ?? "",
      jiraApiToken: "",
      jiraApiTokenConfigured:
        initialData?.jiraConfig?.apiTokenConfigured ?? false,
    },
  });

  const handleSubmit = async (values: SettingsFormInput) => {
    setIsLoading(true);
    try {
      let result: ProfileDto | null = null;

      if (!initialData) {
        const transformedValues =
          transformFormDataForCreateSchema.parse(values);
        result = await createProfile(transformedValues);
      } else {
        const transformedValues = transformFormSchema.parse(values);

        result = await updateProfile({
          ...transformedValues,
          id: initialData.id,
        });
      }

      if (result) {
        toast({
          title: "Success",
          description: "Settings saved successfully.",
        });
        onOpenChange(false); // Close modal on success
      } else {
        throw new Error("Failed to save settings. API returned null.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
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

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Adjust your sprint and fiscal year settings here.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div>
              <FormLabel className="text-sm block mb-2">
                Fiscal year start date
              </FormLabel>
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="fiscalYearStartMonth"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value ? parseInt(value) : undefined)
                        }
                        value={
                          field.value !== undefined
                            ? field.value.toString()
                            : ""
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {monthNames.map((name, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fiscalYearStartDay"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value ? parseInt(value) : undefined)
                        }
                        value={
                          field.value !== undefined
                            ? field.value.toString()
                            : ""
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(
                            (day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription className="mt-2">
                Choose the month and day the fiscal year starts.
              </FormDescription>
            </div>

            <FormField
              control={form.control}
              name="currentSprintStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Sprint Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    The start date of your current sprint.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sprintLengthDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sprint Length (Days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : parseInt(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    How many days each sprint lasts.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentSprintNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Sprint Number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : parseInt(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    The number identifying the current sprint.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jiraConnectionEnabled"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jira Connection</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {form.watch("jiraConnectionEnabled") && (
              <>
                <FormField
                  control={form.control}
                  name="jiraBaseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jira Base URL</FormLabel>
                      <FormControl>
                        <Input type="url" {...field} />
                      </FormControl>
                      <FormDescription>
                        The base URL of your Jira instance.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jiraUserEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jira User Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormDescription>
                        The email address of the user you want to use to connect
                        to Jira.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jiraApiToken"
                  render={({ field }) => {
                    const isConfigured = form.watch("jiraApiTokenConfigured");

                    const handleReset = () => {
                      form.setValue("jiraApiTokenConfigured", false);
                      form.setValue("jiraApiToken", ""); // Clear the actual token value
                      field.onChange(""); // Update the field state
                    };

                    return (
                      <FormItem>
                        <FormLabel>Jira API Token</FormLabel>
                        <FormControl>
                          {isConfigured ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="password"
                                value="********"
                                disabled
                                className="flex-grow"
                                aria-label="Configured API Token"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleReset}
                              >
                                Reset
                              </Button>
                            </div>
                          ) : (
                            <Input type="password" {...field} />
                          )}
                        </FormControl>
                        <FormDescription>
                          {isConfigured
                            ? "API token is configured. Reset to enter a new one."
                            : "The API token for the user you want to use to connect to Jira."}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </>
            )}

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
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
