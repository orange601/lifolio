import { NextResponse } from 'next/server';
import { enqueueVideoRender } from '@/core/repositroy/video/video.render.service';

type RenderBody = { videoJobId: number };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<RenderBody>;
    const videoJobId = Number(body.videoJobId);
    if (!Number.isInteger(videoJobId) || videoJobId <= 0) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_VIDEO_JOB_ID', message: 'Invalid videoJobId.' },
        { status: 400 },
      );
    }

    const queued = await enqueueVideoRender(videoJobId);
    if (!queued.ok) {
      return NextResponse.json(
        { ok: false, code: 'QUEUE_FAILED', message: queued.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: true, job: { id: videoJobId, status: 'pending' } },
      { status: 202 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error.',
      },
      { status: 500 },
    );
  }
}

