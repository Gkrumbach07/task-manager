-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "jira_api_token" TEXT,
ADD COLUMN     "jira_base_url" TEXT,
ADD COLUMN     "jira_user_email" TEXT,
ALTER COLUMN "user_id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "user_id" DROP DEFAULT;
