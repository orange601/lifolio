ALTER TABLE quiz.video_job
ADD COLUMN IF NOT EXISTS audio_qc_status TEXT NULL DEFAULT 'unknown';

