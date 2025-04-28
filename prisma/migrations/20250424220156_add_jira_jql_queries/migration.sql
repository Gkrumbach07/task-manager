-- CreateTable
CREATE TABLE "jira_jql_queries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label" TEXT NOT NULL,
    "label_color" TEXT,
    "jql" TEXT NOT NULL,

    CONSTRAINT "jira_jql_queries_pkey" PRIMARY KEY ("id")
);
