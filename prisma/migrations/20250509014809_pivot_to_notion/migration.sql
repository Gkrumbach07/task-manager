/*
  Warnings:

  - You are about to drop the `tasks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "tasks";

-- CreateTable
CREATE TABLE "notion_tasks" (
    "notion_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "jira_key" TEXT,

    CONSTRAINT "notion_tasks_pkey" PRIMARY KEY ("notion_id")
);
