-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL DEFAULT auth.uid(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fiscal_year_start_date" DATE,
    "first_sprint_start_date" DATE,
    "sprint_length_days" INTEGER,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL DEFAULT auth.uid(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "due_date_type" TEXT,
    "due_date_value" TEXT,
    "status" TEXT NOT NULL,
    "source" TEXT,
    "priority" TEXT NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- Enable Row Level Security for profiles
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles: Users can manage their own profile
CREATE POLICY "Allow full access for own profile"
ON "profiles"
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        (SELECT auth.uid()) = user_id
    )   
    WITH CHECK (
        (SELECT auth.uid()) = user_id
    );

-- Enable Row Level Security for tasks
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;

-- Create policy for tasks: Users can manage their own tasks
CREATE POLICY "Allow full access for own tasks"
ON "tasks"
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        (SELECT auth.uid()) = user_id
    )
    WITH CHECK (
        (SELECT auth.uid()) = user_id
    );
