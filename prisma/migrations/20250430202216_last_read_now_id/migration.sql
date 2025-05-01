/*
  Warnings:

  - You are about to drop the column `read_at` on the `read_jira_issues` table. All the data in the column will be lost.
  - Added the required column `last_read_uuid` to the `read_jira_issues` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "read_jira_issues" DROP COLUMN "read_at",
ADD COLUMN     "last_read_uuid" TEXT NOT NULL;
