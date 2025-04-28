import { JiraJqlQueryDto, type UpdateJiraJqlQueryDto } from "@/lib/jira-jql-queries/schemas";
import { getJqlQueryById, getJqlQueryIds } from "@/lib/jira-jql-queries/services/queries";
import { useMutation, useQueries, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { 
	updateJqlQuery} from "@/lib/jira-jql-queries/services/mutations";
import { searchIssuesByJql } from "@/lib/jira/services/queries";
import { JiraDto } from "@/lib/jira/schemas";
import React from "react";

type UseJiraQueries = {
	queriesResult: UseQueryResult<JiraJqlQueryDto, Error>[];
	jirasResult: UseQueryResult<JiraDto[], Error>[];
	jiras: JiraDto[];
	invalidateQuery: (id: string) => void;
	refetchQuery: (id: string) => void;
	toggleAllJqlQueries: (enabled: boolean) => void;
	toggleJqlQuery: (queryId: string, enabled: boolean) => void;
	executeAllJqlQueries: () => void;
	executeJqlQuery: (queryId: string) => void;
}


export const useJiraQueries = (): UseJiraQueries => {
	const queryClient = useQueryClient();

	const {
	  data: queryIds = [],
	} = useQuery<string[], Error>({
	  queryKey: ["jqlQueryIds"],
	  queryFn: getJqlQueryIds,
	});
  
	const queriesResult = useQueries({
	  queries: queryIds.map((id) => ({
		queryKey: ["jqlQuery", id],
		queryFn: () => getJqlQueryById(id),
	  })),
	});
  
	const queries = queriesResult
	  .map((q) => q.data)
	  .filter((q): q is JiraJqlQueryDto => Boolean(q)); // narrow type
  
	// Utilities
	const invalidateQuery = (id: string) => {
	  queryClient.invalidateQueries({ queryKey: ["jqlQuery", id] });
	};
  
	const refetchQuery = (id: string) => {
	  queryClient.refetchQueries({ queryKey: ["jqlQuery", id] });
	};
  
  
	const updateQuery = useMutation<JiraJqlQueryDto | null, Error, UpdateJiraJqlQueryDto>({
		mutationFn: updateJqlQuery,
		onSuccess: (data) => {
		  if (data) {
			queryClient.invalidateQueries({ queryKey: ["jqlQuery", data.id] });
		  }
		},
	});
  

	const toggleAllJqlQueries = (enabled: boolean) => {
		queries.forEach((query) => {
			updateQuery.mutate({ id: query.id, enabled });
		});
	}

	const toggleJqlQuery = (queryId: string, enabled: boolean) => {
		updateQuery.mutate({ id: queryId, enabled });
	}
	

	// Fetching Jiras through JQL Queries
	const jirasResult = useQueries({
		queries: queries.map((query) => ({
			queryKey: ["jqlQueryJiras", query.id],
			queryFn: () => searchIssuesByJql(query.jql),
		})),
	});

	const executeAllJqlQueries = () => {
		queryClient.refetchQueries({ queryKey: ["jqlQueryJiras"] });
	}

	const executeJqlQuery = (queryId: string) => {
		queryClient.refetchQueries({ queryKey: ["jqlQueryJiras", queryId] });
	}

	const mergedJiras = React.useMemo(() => {
		// all the jira results can overlap so we merge them, taking the latest
		const jiraResultMap = new Map<string, {
			jira: JiraDto,
			updatedAt: number
		}>();
		jirasResult.forEach((qResult) => {
			qResult.data?.forEach((loadedJira) => {
				const lastAddedJira = jiraResultMap.get(loadedJira.id)
				if (!lastAddedJira || qResult.dataUpdatedAt > lastAddedJira.updatedAt) {
					jiraResultMap.set(loadedJira.id, {
						jira: loadedJira,
						updatedAt: qResult.dataUpdatedAt
					});
				}
			});
		});
		return Array.from(jiraResultMap.values()).map((j) => j.jira);
	}, [jirasResult]);
  
	return {
	  jiras: mergedJiras,
	  queriesResult,
	  jirasResult,
	  invalidateQuery,
	  refetchQuery,
	  toggleAllJqlQueries,
	  toggleJqlQuery,
	  executeAllJqlQueries,
	  executeJqlQuery,
	};
}