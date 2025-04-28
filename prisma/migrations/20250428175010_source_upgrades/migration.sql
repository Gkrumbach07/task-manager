/*
  Warnings:

  - A unique constraint covering the columns `[source]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "jira_jql_queries" ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "source_last_synced_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "hidden_jira_issues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "issue_key" TEXT NOT NULL,

    CONSTRAINT "hidden_jira_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tasks_source_key" ON "tasks"("source");
