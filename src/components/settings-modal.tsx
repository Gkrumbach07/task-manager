"use client";

import { useEffect, useState } from "react";
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
import { Switch } from "./ui/switch";

// Define the schema for the form input using zod
const formSchema = z
  .object({
    jiraConnectionEnabled: z.boolean(),
    jiraBaseUrl: z.string().optional(),
    jiraUserEmail: z.string().email("Invalid email address.").optional(),
    jiraApiToken: z.string().optional(),
    jiraApiTokenConfigured: z.boolean(),
    notionConnectionEnabled: z.boolean(),
    notionApiTokenConfigured: z.boolean(),
    notionApiToken: z.string().optional(),
    notionDatabaseId: z.string().optional(),
    githubApiToken: z.string().optional(),
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

    if (data.notionConnectionEnabled) {
      if (!data.notionApiToken || data.notionApiToken.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "A Notion API Token must be provided if the connection is enabled.",
          path: ["notionApiToken"],
        });
      }
      if (!data.notionDatabaseId || data.notionDatabaseId.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "A Notion Database ID must be provided if the connection is enabled.",
          path: ["notionDatabaseId"],
        });
      }

      const isNewTokenProvided =
        data.notionApiToken && data.notionApiToken.trim() !== "";
      const isTokenAlreadyConfigured = data.notionApiTokenConfigured;

      if (!isNewTokenProvided && !isTokenAlreadyConfigured) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "A new Notion API Token must be provided if the connection is enabled and no token is currently configured.",
          path: ["notionApiToken"],
        });
      }
    }
  });

const transformFormSchema = formSchema.transform((formData) => {
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

  let notionConfig;
  if (formData.notionConnectionEnabled) {
    notionConfig = {
      apiToken: !formData.notionApiTokenConfigured
        ? formData.notionApiToken
        : undefined,
      databaseId: formData.notionDatabaseId,
    };
  } else {
    notionConfig = {
      apiToken: null,
      databaseId: null,
    };
  }

  return {
    jiraConfig,
    notionConfig,
    githubApiToken: formData.githubApiToken,
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

    let notionConfig;
    if (formData.notionConfig.apiToken && formData.notionConfig.databaseId) {
      notionConfig = {
        apiToken: formData.notionConfig.apiToken,
        databaseId: formData.notionConfig.databaseId,
      };
    }

    return {
      ...formData,
      jiraConfig,
      notionConfig,
      githubApiToken: formData.githubApiToken,
    };
  }
);

// Infer the type from the schema
type SettingsFormInput = z.infer<typeof formSchema>;

// Define props for the modal
type SettingsModalProps = {
  initialData?: ProfileDto;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function SettingsModal({
  onOpenChange,
  open,
  initialData,
}: SettingsModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const toDefaultValues = (data?: ProfileDto): SettingsFormInput => ({
    jiraConnectionEnabled: data?.jiraConfig?.apiTokenConfigured ?? false,
    jiraBaseUrl: data?.jiraConfig?.baseUrl ?? "",
    jiraUserEmail: data?.jiraConfig?.userEmail ?? "",
    jiraApiToken: "",
    jiraApiTokenConfigured: data?.jiraConfig?.apiTokenConfigured ?? false,
    notionConnectionEnabled: data?.notionConfig?.apiTokenConfigured ?? false,
    notionApiToken: "",
    notionApiTokenConfigured: data?.notionConfig?.apiTokenConfigured ?? false,
    notionDatabaseId: data?.notionConfig?.databaseId ?? "",
  });

  const form = useForm<SettingsFormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(initialData),
  });

  useEffect(() => {
    if (initialData) {
      form.reset(toDefaultValues(initialData));
    }
  }, [initialData, form]);

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

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      form.reset(toDefaultValues(initialData));
    }
    if (open) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
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
            <FormField
              control={form.control}
              name="notionConnectionEnabled"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notion Connection</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {form.watch("notionConnectionEnabled") && (
              <>
                <FormField
                  control={form.control}
                  name="notionDatabaseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notion Database ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        The ID of the Notion database you want to use.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notionApiToken"
                  render={({ field }) => {
                    const isConfigured = form.watch("notionApiTokenConfigured");

                    const handleReset = () => {
                      form.setValue("notionApiTokenConfigured", false);
                      form.setValue("notionApiToken", ""); // Clear the actual token value
                      field.onChange(""); // Update the field state
                    };

                    return (
                      <FormItem>
                        <FormLabel>Notion API Token</FormLabel>
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
                            : "The API token for your Notion account."}
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
