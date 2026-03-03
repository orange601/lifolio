-- CreateTable
CREATE SCHEMA IF NOT EXISTS "quiz";

CREATE TABLE IF NOT EXISTS "quiz"."video_job" (
    "id" BIGSERIAL NOT NULL,
    "quiz_set_id" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'done',
    "output_path" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "video_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "quiz"."video_job_file" (
    "id" BIGSERIAL NOT NULL,
    "video_job_id" BIGINT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'script_json',
    "file_path" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "video_job_file_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_video_job_quiz_set" ON "quiz"."video_job"("quiz_set_id");
CREATE INDEX IF NOT EXISTS "idx_video_job_status" ON "quiz"."video_job"("status");
CREATE INDEX IF NOT EXISTS "idx_video_job_file_job" ON "quiz"."video_job_file"("video_job_id");

-- Foreign Keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'video_job_quiz_set_id_fkey'
      AND table_schema = 'quiz'
      AND table_name = 'video_job'
  ) THEN
    ALTER TABLE "quiz"."video_job"
      ADD CONSTRAINT "video_job_quiz_set_id_fkey"
      FOREIGN KEY ("quiz_set_id") REFERENCES "quiz"."quiz_set"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'video_job_file_video_job_id_fkey'
      AND table_schema = 'quiz'
      AND table_name = 'video_job_file'
  ) THEN
    ALTER TABLE "quiz"."video_job_file"
      ADD CONSTRAINT "video_job_file_video_job_id_fkey"
      FOREIGN KEY ("video_job_id") REFERENCES "quiz"."video_job"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;
