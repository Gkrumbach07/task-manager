/*
  Warnings:

  - The primary key for the `hidden_jira_issues` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `hidden_jira_issues` table. All the data in the column will be lost.
  - The primary key for the `read_jira_issues` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `read_jira_issues` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "hidden_jira_issues" DROP CONSTRAINT "hidden_jira_issues_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "hidden_jira_issues_pkey" PRIMARY KEY ("user_id", "issue_key");

-- AlterTable
ALTER TABLE "read_jira_issues" DROP CONSTRAINT "read_jira_issues_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "read_jira_issues_pkey" PRIMARY KEY ("user_id", "issue_key");
