ALTER TABLE quiz.video_job
ADD COLUMN IF NOT EXISTS tts_provider TEXT NULL DEFAULT 'local';

