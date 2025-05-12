import { JiraExplorer } from "@/components/explore/jira-explorer";

export default function ExplorePage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Explore</h1>
        <p className="text-muted-foreground">
          Discover and import tasks from Jira
        </p>
      </div>
      <JiraExplorer />
    </div>
  );
}
