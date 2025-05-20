"use client";

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJiraIssueByKey } from '@/lib/jira/services/queries';
import { createNotionPage } from '@/lib/notion/services';
import { jiraToCreateNotionPageDto } from "@/lib/notion/mappers";
import type { JiraDto } from '@/lib/jira/schemas';
import type { CreateNotionPageDto } from '@/lib/notion/schemas';
import { useToast } from './use-toast';

type UseJiraPasteHandlerReturn = {
  isModalOpen: boolean;
  closeModal: () => void;
  jiraIssue: JiraDto | null | undefined;
  isLoadingJira: boolean;
  isCreatingNotionPage: boolean;
  jiraError: Error | null;
  handleImportConfirm: () => void;
  pastedKey: string | null;
};

const JIRA_KEY_REGEX = /([A-Z]+-\d+)/;

export const useJiraPasteHandler = (): UseJiraPasteHandlerReturn => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pastedKey, setPastedKey] = useState<string | null>(null);

  const { data: jiraIssue, isLoading: isLoadingJira, error: jiraError } = useQuery<JiraDto, Error>({
    queryKey: ['pastedJiraIssue', pastedKey],
    queryFn: async () => {
      if (!pastedKey) throw new Error('No Jira key provided');
      return getJiraIssueByKey(pastedKey);
    },
    enabled: !!pastedKey && isModalOpen,
    retry: false,
    staleTime: Infinity, // Keep data fresh until modal is closed or key changes
  });

  const { mutate: createNotionPageMutation, isPending: isCreatingNotionPage } = useMutation<
    boolean,
    Error,
    CreateNotionPageDto
  >({
    mutationFn: createNotionPage,
    onSuccess: () => {
      toast({ title: `Notion page created for ${pastedKey}!` });
      qc.invalidateQueries({ queryKey: ['notionPages'] }); 
      qc.invalidateQueries({ queryKey: ['jiras'] });
      closeModal();
    },
    onError: (error) => {
      toast({
        title: `Error creating Notion page for ${pastedKey}`,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const text = event.clipboardData?.getData('text');
    if (text) {
      const match = text.match(JIRA_KEY_REGEX);
      if (match && match[0]) {
        setPastedKey(match[0]);
        setIsModalOpen(true);
        // Potentially prevent default paste action if desired
        // event.preventDefault(); 
      }
    }
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    qc.removeQueries({ queryKey: ['pastedJiraIssue', pastedKey] });
    setPastedKey(null); 
  }, [qc, pastedKey]);

  const handleImportConfirm = () => {
    if (jiraIssue) {
      const notionPageDto = jiraToCreateNotionPageDto(jiraIssue);
      createNotionPageMutation(notionPageDto);
    }
  };

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return {
    isModalOpen,
    closeModal,
    jiraIssue,
    isLoadingJira,
    isCreatingNotionPage,
    jiraError,
    handleImportConfirm,
    pastedKey,
  };
}; 