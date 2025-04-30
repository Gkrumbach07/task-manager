import React from "react";
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

import {
  getJqlQueries,
} from "@/lib/jira-jql-queries/services/queries";
import {
  updateJqlQuery,
  deleteJqlQuery,
} from "@/lib/jira-jql-queries/services/mutations";
import { searchIssuesByJql } from "@/lib/jira/services/queries";
import {
  JiraJqlQueryDto,
  UpdateJiraJqlQueryDto,
} from "@/lib/jira-jql-queries/schemas";
import { JiraIssueWithQuery, JiraQueryExecution } from "@/components/explore/types";

export type JQLQuery = {
	query: JiraJqlQueryDto;
	isExecuteSuccess: boolean;
	isExecuting: boolean;
	isExecuteError: boolean;
	executeError: Error | null;
	isExecuteStale: boolean;
	issueCount: number | null;
	isFetching: boolean;
	isFetchError: boolean;
	fetchError: Error | null;
	refetch: () => void;
	toggleEnabled: (enabled: boolean) => void;
	delete: () => void;
	execute: () => void;
}

export type UseJiraQueries = {
	queries: JQLQuery[];
	isQueryLoading: boolean;
	isQueryError: boolean;
	queryError: Error | null;
	jiras: JiraIssueWithQuery[];
	executeAllJqlQueries: () => void;
	toggleAllJqlQueries: (enabled: boolean) => void;
}

export const useJiraQueries = (): UseJiraQueries => {
  const qc = useQueryClient();

  // 1) Fetch list of JQL IDs
  const queryDefsResult = useQuery<JiraJqlQueryDto[], Error>({
    queryKey: ["jqlQueryDefs"],
    queryFn: async () => {
		const res = await getJqlQueries()
		return res
	  },	  
  });

  const {data: queryDefs = []} = queryDefsResult


  // 3) For each enabled bundle, fetch its Jiras (tag with meta.queryId)
  const jirasResult = useQueries<UseQueryOptions<JiraQueryExecution>[]>({
    queries: queryDefs.map((b) => ({
      queryKey: ["jqlQueryJiras", b.id],
      queryFn: async () => {
		const res = await searchIssuesByJql(b.jql);
		return {
			queryId: b.id,
			lastExecutedJql: b.jql,
			issues: res
		}
	  },
      enabled: false,
	  retry: false,
	  staleTime: 0,
    })),
  });

  const queryToExecutionMap = React.useMemo(() => {
	const map = new Map<string, UseQueryResult<JiraQueryExecution>>()
	jirasResult.forEach((r, i) => {
		map.set(queryDefs[i].id, r)
	})
	return map
  }, [queryDefs, jirasResult])

   // 5) Merge + dedupe all issues, attach fromJqlQuery array
   const mergedJiras = React.useMemo(() => {
    type Slot = { jira: JiraIssueWithQuery; updatedAt: number };
    const map = new Map<string, Slot>();

    jirasResult.forEach((r) => {		
      r.data?.issues.forEach((issue) => {
		// get the latest query based on the queryId stored in the jira search result
		const query = queryDefs.find(b => b.id === r.data.queryId)

		if (!query) {
			// no query found, this should never happen
			return
		}

        const existing = map.get(issue.id);
        if (!existing || r.dataUpdatedAt > existing.updatedAt) {
          // newer load wins, but carry forward any previous tags
          const prevTags = existing?.jira.fromJqlQuery ?? [];
          map.set(issue.id, {
            jira: { ...issue, fromJqlQuery: [...prevTags, query] },
            updatedAt: r.dataUpdatedAt,
          });
        } else {
          // older load—but add this queryId if missing
          existing.jira.fromJqlQuery = Array.from(
            new Set([...existing.jira.fromJqlQuery, query])
          );
        }
      });
    });

    return Array.from(map.values()).map((v) => v.jira);
  }, [queryDefs, jirasResult]);


  // 7) Mutations for toggling & deleting
  const updateMut = useMutation<
    JiraJqlQueryDto | null,
    Error,
    UpdateJiraJqlQueryDto
  >({
    mutationFn: updateJqlQuery,
	// Optimistically update before the request completes
	onMutate: async ({ id, enabled }) => {
		await qc.cancelQueries({ queryKey: ['jqlQueryDefs'] });
		const previousRows = qc.getQueryData(['jqlQueryDefs']);
		qc.setQueryData(['jqlQueryDefs'], (old: JiraJqlQueryDto[]) =>
		  old?.map((row: JiraJqlQueryDto) =>
			row.id !== id ? row : { ...row, enabled }
		  )
		);
		return { previousRows }; 
	  },
	  onError: (_err, _vars, context) => {
		// Rollback if there was an error
		const previousRows = (context as { previousRows: JiraJqlQueryDto }).previousRows
		if (previousRows) {
			qc.setQueryData(['jqlQueryDefs'], previousRows);
		}
		else{
			qc.invalidateQueries({ queryKey: ['jqlQueryDefs'] });
		}
	  },
  });

  const deleteMut = useMutation<string, Error, string>({
    mutationFn: async (id) => {
		await deleteJqlQuery(id)
		return id
	},
    onSuccess: (id) => {
		 // Optimistically update the cached list
		 qc.setQueryData(['jqlQueryDefs'], (oldRows: JiraJqlQueryDto[]) =>
			oldRows?.filter((row: JiraJqlQueryDto) =>
			  row.id !== id
			)
		  );
	},
  });

  const queries: JQLQuery[] = React.useMemo(() => 
	 queryDefs.map((d) => {
		// Find the execution for this query if it exists
		const execution = queryToExecutionMap.get(d.id)


		const isStale = execution?.data && execution.data.lastExecutedJql !== d.jql && execution.isSuccess

	return {
		query: d,
		isExecuteSuccess: execution?.isSuccess ?? false,
		isExecuting: execution?.isFetching ?? false,
		isExecuteError: execution?.isError ?? false,
		executeError: execution?.error ?? null,
		isExecuteStale: isStale ?? false,
		issueCount: execution?.data?.issues.length ?? null,
		isFetching: queryDefsResult.isFetching,
		isFetchError: queryDefsResult.isError,
		fetchError: queryDefsResult.error,
		refetch: () => queryDefsResult.refetch(),
		toggleEnabled: () => updateMut.mutate({ id: d.id, enabled: !d.enabled }),
		delete: () => deleteMut.mutate(d.id),
		execute: () => {
			if (execution) {
				execution.refetch()
			}
			else{
				qc.fetchQuery({ queryKey: ["jqlQueryJiras", d.id] })
			}
		},
	}
  }), [queryDefs, queryToExecutionMap, queryDefsResult, updateMut, deleteMut, qc])

  const enabledJiras = React.useMemo(() => mergedJiras.filter((j) => j.fromJqlQuery.some((q) => q.enabled)), [mergedJiras])

  // 8) Final API surface
  return {
    queries,
    jiras: enabledJiras,
	
	// query status
	isQueryLoading: queryDefsResult.isLoading,
	isQueryError: queryDefsResult.isError,
	queryError: queryDefsResult.error,

    // actions
    toggleAllJqlQueries: (enabled: boolean) =>
      queryDefs.forEach((b) => updateMut.mutate({ id: b.id, enabled })),
    executeAllJqlQueries: () =>
      queryDefs.forEach((b) => {
		if(b.enabled) {
			const execution = queryToExecutionMap.get(b.id)
			if (execution) {
				execution.refetch()
			}
			else {
					qc.fetchQuery({ queryKey: ["jqlQueryJiras", b.id] })
			}
		}
	  }),
  };
};
