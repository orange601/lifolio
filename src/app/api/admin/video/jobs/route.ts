import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildVideoScriptFromQuizSet } from '@/core/repositroy/video/video.script.service';
import { prisma } from '@/lib/db/prisma';

type CreateVideoJobBody = {
  quizSetId: number;
  questionDurationSec?: number;
  answerDurationSec?: number;
  ttsProvider?: string;
  voiceTone?: string;
  questionRatePct?: number;
  answerRatePct?: number;
  questionPauseMs?: number;
  answerPauseMs?: number;
  narrationEnabled?: boolean;
  sfxEnabled?: boolean;
  bgmPreset?: string;
  narrationVolume?: number;
  bgmVolume?: number;
  sfxVolume?: number;
  masteringPreset?: string;
  targetLufs?: number;
};

type VideoJobListRow = {
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

function toSafeInt(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN;
  return Math.floor(n);
}

function toSafeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'quiz-set';
}

function clamp01(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function clampLufs(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(-24, Math.min(-10, n));
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

async function ensureVideoJobTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS quiz.video_job (
      id BIGSERIAL PRIMARY KEY,
      quiz_set_id BIGINT NOT NULL REFERENCES quiz.quiz_set(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'created',
      output_path TEXT NULL,
      audio_qc_status TEXT NULL DEFAULT 'unknown',
      tts_provider TEXT NULL DEFAULT 'local',
      voice_tone TEXT NULL DEFAULT 'calm',
      question_rate_pct INTEGER NULL DEFAULT 100,
      answer_rate_pct INTEGER NULL DEFAULT 100,
      question_pause_ms INTEGER NULL DEFAULT 300,
      answer_pause_ms INTEGER NULL DEFAULT 350,
      narration_enabled BOOLEAN NULL DEFAULT TRUE,
      sfx_enabled BOOLEAN NULL DEFAULT TRUE,
      bgm_preset TEXT NULL DEFAULT 'focus',
      narration_volume DOUBLE PRECISION NULL DEFAULT 1.0,
      bgm_volume DOUBLE PRECISION NULL DEFAULT 0.08,
      sfx_volume DOUBLE PRECISION NULL DEFAULT 1.0,
      mastering_preset TEXT NULL DEFAULT 'voice_focus',
      target_lufs DOUBLE PRECISION NULL DEFAULT -16.0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS audio_qc_status TEXT NULL DEFAULT 'unknown'
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS tts_provider TEXT NULL DEFAULT 'local'
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS voice_tone TEXT NULL DEFAULT 'calm'
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS question_rate_pct INTEGER NULL DEFAULT 100
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS answer_rate_pct INTEGER NULL DEFAULT 100
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS question_pause_ms INTEGER NULL DEFAULT 300
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS answer_pause_ms INTEGER NULL DEFAULT 350
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS narration_enabled BOOLEAN NULL DEFAULT TRUE
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS sfx_enabled BOOLEAN NULL DEFAULT TRUE
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS bgm_preset TEXT NULL DEFAULT 'focus'
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS narration_volume DOUBLE PRECISION NULL DEFAULT 1.0
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS bgm_volume DOUBLE PRECISION NULL DEFAULT 0.08
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS sfx_volume DOUBLE PRECISION NULL DEFAULT 1.0
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS mastering_preset TEXT NULL DEFAULT 'voice_focus'
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE quiz.video_job
    ADD COLUMN IF NOT EXISTS target_lufs DOUBLE PRECISION NULL DEFAULT -16.0
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_video_job_quiz_set ON quiz.video_job(quiz_set_id)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_video_job_status ON quiz.video_job(status)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS quiz.video_job_file (
      id BIGSERIAL PRIMARY KEY,
      video_job_id BIGINT NOT NULL REFERENCES quiz.video_job(id) ON DELETE CASCADE,
      kind TEXT NOT NULL DEFAULT 'script_json',
      file_path TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_video_job_file_job ON quiz.video_job_file(video_job_id)
  `);
}

async function saveVideoJobRecord(input: {
  quizSetId: number;
  status: 'created' | 'done' | 'failed';
  outputPath: string;
  ttsProvider: string;
  voiceTone: string;
  questionRatePct: number;
  answerRatePct: number;
  questionPauseMs: number;
  answerPauseMs: number;
  narrationEnabled: boolean;
  sfxEnabled: boolean;
  bgmPreset: string;
  narrationVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  masteringPreset: string;
  targetLufs: number;
}) {
  await ensureVideoJobTables();

  const inserted = (await prisma.$queryRawUnsafe(`
    INSERT INTO quiz.video_job (
      quiz_set_id,
      status,
      output_path,
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
    )
    VALUES (
      $1::bigint,
      $2::text,
      $3::text,
      $4::text,
      $5::text,
      $6::int,
      $7::int,
      $8::int,
      $9::int,
      $10::boolean,
      $11::boolean,
      $12::text,
      $13::float8,
      $14::float8,
      $15::float8,
      $16::text,
      $17::float8,
      NOW(),
      NOW()
    )
    RETURNING id
  `, input.quizSetId, input.status, input.outputPath, input.ttsProvider, input.voiceTone, input.questionRatePct, input.answerRatePct, input.questionPauseMs, input.answerPauseMs, input.narrationEnabled, input.sfxEnabled, input.bgmPreset, input.narrationVolume, input.bgmVolume, input.sfxVolume, input.masteringPreset, input.targetLufs)) as Array<{ id: bigint | number }>;

  const videoJobId = Number(inserted[0].id);

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO quiz.video_job_file (video_job_id, kind, file_path, created_at)
      VALUES ($1::bigint, 'script_json', $2::text, NOW())
    `,
    videoJobId,
    input.outputPath,
  );

  return videoJobId;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitRaw = Number(url.searchParams.get('limit') ?? 30);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 30;

    await ensureVideoJobTables();

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
        ORDER BY id DESC
        LIMIT $1::int
      `,
      limit,
    )) as VideoJobListRow[];

    return NextResponse.json(
      {
        ok: true,
        items: rows.map((row) => ({
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
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/admin/video/jobs failed:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CreateVideoJobBody>;
    const quizSetId = toSafeInt(body.quizSetId);
    const questionDurationSec =
      body.questionDurationSec == null ? 7 : toSafeInt(body.questionDurationSec);
    const answerDurationSec =
      body.answerDurationSec == null ? 4 : toSafeInt(body.answerDurationSec);
    const narrationEnabled = body.narrationEnabled !== false;
    const ttsProvider =
      typeof body.ttsProvider === 'string' && body.ttsProvider.trim()
        ? body.ttsProvider.trim().toLowerCase()
        : 'local';
    const voiceTone =
      typeof body.voiceTone === 'string' && body.voiceTone.trim()
        ? body.voiceTone.trim().toLowerCase()
        : 'calm';
    const questionRatePct = clampInt(body.questionRatePct, 70, 140, 100);
    const answerRatePct = clampInt(body.answerRatePct, 70, 140, 100);
    const questionPauseMs = clampInt(body.questionPauseMs, 0, 2000, 300);
    const answerPauseMs = clampInt(body.answerPauseMs, 0, 2000, 350);
    const sfxEnabled = body.sfxEnabled !== false;
    const bgmPreset =
      typeof body.bgmPreset === 'string' && body.bgmPreset.trim()
        ? body.bgmPreset.trim()
        : 'focus';
    const narrationVolume = clamp01(body.narrationVolume, 1);
    const bgmVolume = clamp01(body.bgmVolume, 0.08);
    const sfxVolume = clamp01(body.sfxVolume, 1);
    const masteringPreset =
      typeof body.masteringPreset === 'string' && body.masteringPreset.trim()
        ? body.masteringPreset.trim()
        : 'voice_focus';
    const targetLufs = clampLufs(body.targetLufs, -16);

    if (!Number.isInteger(quizSetId) || quizSetId <= 0) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_QUIZ_SET_ID', message: 'Invalid quiz set id.' },
        { status: 400 },
      );
    }

    const result = await buildVideoScriptFromQuizSet(quizSetId, {
      allowDraft: false,
      questionDurationSec,
      answerDurationSec,
      ttsProvider,
      voiceTone,
      questionRatePct,
      answerRatePct,
      questionPauseMs,
      answerPauseMs,
      narrationEnabled,
      sfxEnabled,
      bgmPreset,
      narrationVolume,
      bgmVolume,
      sfxVolume,
      masteringPreset,
      targetLufs,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: result.code,
          message: result.message,
          invalidQuestionIds: result.invalidQuestionIds ?? [],
        },
        { status: 400 },
      );
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const jobId = `video-${quizSetId}-${Date.now()}`;
    const safeTitle = toSafeFileName(result.script.quizSet.title);
    const fileName = `${timestamp}-quizset-${quizSetId}-${safeTitle}.json`;
    const outputDir = path.join(process.cwd(), 'output', 'video-scripts');
    const outputPath = path.join(outputDir, fileName);

    await mkdir(outputDir, { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(result.script, null, 2)}\n`, 'utf-8');

    let videoJobId: number | null = null;
    let dbSaved = false;
    let dbWarning: string | null = null;

    try {
      videoJobId = await saveVideoJobRecord({
        quizSetId,
        status: 'created',
        outputPath,
        ttsProvider,
        voiceTone,
        questionRatePct,
        answerRatePct,
        questionPauseMs,
        answerPauseMs,
        narrationEnabled,
        sfxEnabled,
        bgmPreset,
        narrationVolume,
        bgmVolume,
        sfxVolume,
        masteringPreset,
        targetLufs,
      });
      dbSaved = true;
    } catch (error) {
      dbSaved = false;
      dbWarning = error instanceof Error ? error.message : 'Failed to save video job in DB.';
    }

    return NextResponse.json(
      {
        ok: true,
        job: {
          id: jobId,
          status: 'created',
          createdAt: new Date().toISOString(),
          quizSetId,
          dbId: videoJobId,
          dbSaved,
          dbWarning,
        },
        file: {
          name: fileName,
          relativePath: path.join('output', 'video-scripts', fileName),
          absolutePath: outputPath,
        },
        script: result.script,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('POST /api/admin/video/jobs failed:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
