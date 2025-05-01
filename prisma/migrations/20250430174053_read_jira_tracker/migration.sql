-- CreateTable
CREATE TABLE "read_jira_issues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "issue_key" TEXT NOT NULL,

    CONSTRAINT "read_jira_issues_pkey" PRIMARY KEY ("id")
);
