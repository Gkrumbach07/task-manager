/*
  Warnings:

  - Added the required column `read_at` to the `read_jira_issues` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "read_jira_issues" ADD COLUMN     "read_at" TIMESTAMP(3) NOT NULL;
