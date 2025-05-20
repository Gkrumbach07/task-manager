import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { JiraDto } from "@/lib/jira/schemas";
import { Badge } from "@/components/ui/badge";

type JiraImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  jiraIssue: JiraDto | null | undefined;
  isLoading: boolean;
  isImporting: boolean;
  error: Error | null;
  pastedKey: string | null;
};

export const JiraImportModal: React.FC<JiraImportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  jiraIssue,
  isLoading,
  isImporting,
  error,
  pastedKey,
}) => {
  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isLoading
              ? `Fetching ${pastedKey}...`
              : error || !jiraIssue
              ? `Import Jira Issue`
              : `Import ${jiraIssue.key}`}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {error ? (
                <span className="text-destructive">{error.message}</span>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : jiraIssue ? (
                <span className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-sm w-full overflow-hidden">
                  <Badge variant="outline" className="flex-shrink-0">
                    {jiraIssue.type}
                  </Badge>
                  <span
                    className="flex-shrink min-w-0 truncate"
                    title={jiraIssue.title}
                  >
                    {jiraIssue.title}
                  </span>
                  <Badge className="flex-shrink-0">{jiraIssue.status}</Badge>
                </span>
              ) : (
                <span>{`Could not find details for ${pastedKey}.`}</span>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isImporting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              onConfirm();
              e.preventDefault();
            }}
            disabled={isLoading || !!error || !jiraIssue || isImporting}
          >
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Import
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
