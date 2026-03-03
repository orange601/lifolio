import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

type VideoJobRow = {
  id: bigint | number;
  quiz_set_id: bigint | number;
  status: string;
  output_path: string | null;
  audio_qc_status: string | null;
  tts_provider: string | null;
  voice_tone: string | null;
  question_rate_pct: number | null;
  answer_rate_pct: number | null;
  question_pause_ms: number | null;
  answer_pause_ms: number | null;
  narration_enabled: boolean | null;
  sfx_enabled: boolean | null;
  bgm_preset: string | null;
  narration_volume: number | null;
  bgm_volume: number | null;
  sfx_volume: number | null;
  mastering_preset: string | null;
  target_lufs: number | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type VideoJobFileRow = {
  id: bigint | number;
  kind: string;
  file_path: string;
  created_at: Date | string;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const videoJobId = Number(id);
    if (!Number.isInteger(videoJobId) || videoJobId <= 0) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_VIDEO_JOB_ID', message: 'Invalid video job id.' },
        { status: 400 },
      );
    }

    const rows = (await prisma.$queryRawUnsafe(
      `
        SELECT
          id,
          quiz_set_id,
          status,
          output_path,
          audio_qc_status,
          tts_provider,
          voice_tone,
          question_rate_pct,
          answer_rate_pct,
          question_pause_ms,
          answer_pause_ms,
          narration_enabled,
          sfx_enabled,
          bgm_preset,
          narration_volume,
          bgm_volume,
          sfx_volume,
          mastering_preset,
          target_lufs,
          created_at,
          updated_at
        FROM quiz.video_job
        WHERE id = $1::bigint
        LIMIT 1
      `,
      videoJobId,
    )) as VideoJobRow[];

    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, code: 'VIDEO_JOB_NOT_FOUND', message: 'Video job not found.' },
        { status: 404 },
      );
    }

    const files = (await prisma.$queryRawUnsafe(
      `
        SELECT id, kind, file_path, created_at
        FROM quiz.video_job_file
        WHERE video_job_id = $1::bigint
        ORDER BY id ASC
      `,
      videoJobId,
    )) as VideoJobFileRow[];

    const row = rows[0];

    return NextResponse.json(
      {
        ok: true,
        job: {
          id: Number(row.id),
          quizSetId: Number(row.quiz_set_id),
          status: row.status,
          outputPath: row.output_path,
          audioQcStatus: row.audio_qc_status ?? 'unknown',
          audio: {
            ttsProvider: row.tts_provider ?? 'local',
            voiceTone: row.voice_tone ?? 'calm',
            questionRatePct: Number.isFinite(Number(row.question_rate_pct))
              ? Number(row.question_rate_pct)
              : 100,
            answerRatePct: Number.isFinite(Number(row.answer_rate_pct))
              ? Number(row.answer_rate_pct)
              : 100,
            questionPauseMs: Number.isFinite(Number(row.question_pause_ms))
              ? Number(row.question_pause_ms)
              : 300,
            answerPauseMs: Number.isFinite(Number(row.answer_pause_ms))
              ? Number(row.answer_pause_ms)
              : 350,
            narrationEnabled: row.narration_enabled !== false,
            sfxEnabled: row.sfx_enabled !== false,
            bgmPreset: row.bgm_preset ?? 'focus',
            narrationVolume: Number.isFinite(Number(row.narration_volume))
              ? Number(row.narration_volume)
              : 1,
            bgmVolume: Number.isFinite(Number(row.bgm_volume)) ? Number(row.bgm_volume) : 0.08,
            sfxVolume: Number.isFinite(Number(row.sfx_volume)) ? Number(row.sfx_volume) : 1,
            masteringPreset: row.mastering_preset ?? 'voice_focus',
            targetLufs: Number.isFinite(Number(row.target_lufs)) ? Number(row.target_lufs) : -16,
          },
          createdAt: new Date(row.created_at).toISOString(),
          updatedAt: new Date(row.updated_at).toISOString(),
        },
        files: files.map((file) => ({
          id: Number(file.id),
          kind: file.kind,
          filePath: file.file_path,
          createdAt: new Date(file.created_at).toISOString(),
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/admin/video/jobs/[id] failed:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
