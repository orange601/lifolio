import { NextResponse } from 'next/server';
import { buildVideoScriptFromQuizSet } from '@/core/repositroy/video/video.script.service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const quizSetId = Number(id);
    const result = await buildVideoScriptFromQuizSet(quizSetId, {
      allowDraft: true,
      questionDurationSec: 7,
      answerDurationSec: 4,
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

    return NextResponse.json(
      {
        ok: true,
        quizSet: result.script.quizSet,
        totalQuestions: result.script.totalQuestions,
        totalDurationSec: result.script.totalDurationSec,
        questions: result.script.questions,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/admin/video/sets/[id] failed:', error);
    return NextResponse.json(
      { ok: false, code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error.' },
      { status: 500 },
    );
  }
}

