import { prisma } from '@/lib/db/prisma';
import type { VideoQuestionItem, VideoScene, VideoScript } from './video.script.type';

type BuildOptions = {
  allowDraft?: boolean;
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

type BuildResult =
  | { ok: true; script: VideoScript }
  | { ok: false; code: string; message: string; invalidQuestionIds?: number[] };

function toNumber(value: bigint | number): number {
  return typeof value === 'bigint' ? Number(value) : value;
}

function clamp01(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function clampLufs(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(-24, Math.min(-10, value));
}

function clampInt(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

export async function buildVideoScriptFromQuizSet(
  quizSetId: number,
  options: BuildOptions = {},
): Promise<BuildResult> {
  if (!Number.isInteger(quizSetId) || quizSetId <= 0) {
    return { ok: false, code: 'INVALID_QUIZ_SET_ID', message: 'Invalid quiz set id.' };
  }

  const row = await prisma.quiz_set.findUnique({
    where: { id: BigInt(quizSetId) },
    select: {
      id: true,
      title: true,
      status: true,
      quiz_set_questions: {
        orderBy: [{ order_no: { sort: 'asc', nulls: 'last' } }, { question_id: 'asc' }],
        select: {
          question_id: true,
          order_no: true,
          question: {
            select: {
              stem: true,
              explanation: true,
              type: true,
              choices: {
                orderBy: [{ order_no: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
                select: {
                  content: true,
                  is_correct: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!row) {
    return { ok: false, code: 'QUIZ_SET_NOT_FOUND', message: 'Quiz set not found.' };
  }

  if (!options.allowDraft && row.status !== 'published') {
    return {
      ok: false,
      code: 'QUIZ_SET_NOT_PUBLISHED',
      message: 'Quiz set must be published before generating script.',
    };
  }

  const invalidQuestionIds: number[] = [];
  const questions: VideoQuestionItem[] = [];

  for (let index = 0; index < row.quiz_set_questions.length; index += 1) {
    const item = row.quiz_set_questions[index];
    const questionId = toNumber(item.question_id);
    const questionType = (item.question.type ?? '').toUpperCase();
    const questionText = item.question.stem?.trim() ?? '';
    const choices = item.question.choices.map((choice) => choice.content.trim());
    const correctIndex = item.question.choices.findIndex((choice) => choice.is_correct);

    if (questionType !== 'MCQ' || !questionText || choices.length !== 4 || correctIndex < 0) {
      invalidQuestionIds.push(questionId);
      continue;
    }

    const dedup = new Set(choices.map((value) => value.toLowerCase()));
    if (dedup.size !== choices.length) {
      invalidQuestionIds.push(questionId);
      continue;
    }

    const correctCount = item.question.choices.filter((choice) => choice.is_correct).length;
    if (correctCount !== 1) {
      invalidQuestionIds.push(questionId);
      continue;
    }

    questions.push({
      order: index + 1,
      questionId,
      question: questionText,
      choices,
      correctIndex,
      explanation: item.question.explanation?.trim() || null,
    });
  }

  if (invalidQuestionIds.length > 0) {
    return {
      ok: false,
      code: 'INVALID_QUESTIONS',
      message: 'Some questions are not video-ready.',
      invalidQuestionIds,
    };
  }

  if (questions.length === 0) {
    return {
      ok: false,
      code: 'EMPTY_QUIZ_SET',
      message: 'Quiz set has no usable questions.',
    };
  }

  const questionDurationSec = Math.max(1, Math.floor(options.questionDurationSec ?? 7));
  const answerDurationSec = Math.max(1, Math.floor(options.answerDurationSec ?? 4));

  const scenes: VideoScene[] = [];
  let sceneNo = 1;
  for (const item of questions) {
    scenes.push({
      sceneNo,
      type: 'question',
      durationSec: questionDurationSec,
      questionId: item.questionId,
      text: item.question,
      choices: item.choices,
    });
    sceneNo += 1;
    scenes.push({
      sceneNo,
      type: 'answer',
      durationSec: answerDurationSec,
      questionId: item.questionId,
      correctIndex: item.correctIndex,
      correctChoice: item.choices[item.correctIndex],
      explanation: item.explanation,
    });
    sceneNo += 1;
  }

  const totalDurationSec = scenes.reduce((acc, scene) => acc + scene.durationSec, 0);

  return {
    ok: true,
    script: {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      audio: {
        ttsProvider: options.ttsProvider ?? 'local',
        voiceTone: options.voiceTone ?? 'calm',
        questionRatePct: clampInt(options.questionRatePct ?? 100, 70, 140, 100),
        answerRatePct: clampInt(options.answerRatePct ?? 100, 70, 140, 100),
        questionPauseMs: clampInt(options.questionPauseMs ?? 300, 0, 2000, 300),
        answerPauseMs: clampInt(options.answerPauseMs ?? 350, 0, 2000, 350),
        narrationEnabled: options.narrationEnabled ?? true,
        sfxEnabled: options.sfxEnabled ?? true,
        bgmPreset: options.bgmPreset ?? 'focus',
        narrationVolume: clamp01(options.narrationVolume ?? 1, 1),
        bgmVolume: clamp01(options.bgmVolume ?? 0.08, 0.08),
        sfxVolume: clamp01(options.sfxVolume ?? 1, 1),
        masteringPreset: options.masteringPreset ?? 'voice_focus',
        targetLufs: clampLufs(options.targetLufs ?? -16, -16),
      },
      quizSet: {
        id: toNumber(row.id),
        title: row.title,
        status: row.status,
      },
      totalQuestions: questions.length,
      totalDurationSec,
      questions,
      scenes,
    },
  };
}
