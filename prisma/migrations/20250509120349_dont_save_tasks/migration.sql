/*
  Warnings:

  - You are about to drop the `notion_tasks` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "notion_api_token" TEXT,
ADD COLUMN     "notion_database_id" TEXT;

-- DropTable
DROP TABLE "notion_tasks";
