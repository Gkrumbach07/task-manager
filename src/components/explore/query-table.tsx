import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  Table,
} from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { JQLQuery } from "@/hooks/use-jira-queries";
import { QueryTableRow } from "./query-table-row";

export function QueryTable({
  queries,
  toggleAllJqlQueries,
}: {
  queries: JQLQuery[];
  toggleAllJqlQueries: (enabled: boolean) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px] px-2 text-center">
            <Checkbox
              checked={
                queries.length > 0 && queries.every((r) => r.query.enabled)
                  ? true
                  : queries.some((r) => r.query.enabled)
                  ? "indeterminate"
                  : false
              }
              onCheckedChange={toggleAllJqlQueries}
              aria-label="Select all queries"
              disabled={queries.some((r) => r.isExecuting || r.isFetching)}
            />
            <span className="sr-only">Select</span>
          </TableHead>
          <TableHead className="w-[30px] px-1 text-center">
            <span className="sr-only">Status</span>
          </TableHead>
          <TableHead>Label</TableHead>
          <TableHead>JQL</TableHead>
          <TableHead className="w-[50px] text-center">Issues</TableHead>
          <TableHead className="w-[120px] text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queries.map((r) => (
          <QueryTableRow
            key={r.query.id}
            query={r.query}
            isExecuteStale={r.isExecuteStale}
            toggleEnabled={r.toggleEnabled}
            isExecuting={r.isExecuting}
            isFetching={r.isFetching}
            isExecuteSuccess={r.isExecuteSuccess}
            isExecuteError={r.isExecuteError}
            executeError={r.executeError}
            issueCount={r.issueCount}
            execute={r.execute}
            handleDelete={r.delete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
